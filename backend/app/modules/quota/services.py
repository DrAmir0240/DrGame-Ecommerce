"""Quota deduction engine: user quota caching, consumption logging, and HMAC webhook verification."""
import hmac
import hashlib
import json
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.exceptions import (
    NotFoundError,
    BadRequestError,
    AuthorizationError,
)
from app.modules.quota.models import UserQuota, QuotaConsumptionLog

logger = logging.getLogger("drgame.quota")

class QuotaService:

    @staticmethod
    def verify_webhook_signature(
        user_id: int,
        game_id: int,
        bytes_downloaded: int,
        download_server_id: str,
        provided_signature: str
    ) -> bool:
        """Verify HMAC-SHA256 signature to protect quota webhook from forgery."""
        message = f"{user_id}:{game_id}:{bytes_downloaded}:{download_server_id}"
        expected = hmac.new(
            settings.WEBHOOK_SECRET_KEY.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, provided_signature)

    @staticmethod
    def generate_webhook_signature(
        user_id: int,
        game_id: int,
        bytes_downloaded: int,
        download_server_id: str
    ) -> str:
        """Generate HMAC-SHA256 signature for test requests."""
        message = f"{user_id}:{game_id}:{bytes_downloaded}:{download_server_id}"
        return hmac.new(
            settings.WEBHOOK_SECRET_KEY.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

    @staticmethod
    async def get_user_quota(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int
    ) -> dict:
        """Fetch user quota with Redis caching (TTL 300s)."""
        cache_key = f"drgame:user:{user_id}:quota"
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis get quota error: {e}")

        quota = await db.scalar(select(UserQuota).where(UserQuota.user_id == user_id))
        if not quota:
            quota = UserQuota(
                user_id=user_id,
                total_quota_gb=0.0,
                used_quota_gb=0.0,
                remaining_quota_gb=0.0
            )
            db.add(quota)
            await db.commit()
            await db.refresh(quota)

        data = {
            "user_id": quota.user_id,
            "total_quota_gb": round(quota.total_quota_gb, 2),
            "used_quota_gb": round(quota.used_quota_gb, 2),
            "remaining_quota_gb": round(quota.remaining_quota_gb, 2),
            "percent_used": round((quota.used_quota_gb / quota.total_quota_gb * 100), 1) if quota.total_quota_gb > 0 else 0.0
        }

        try:
            await redis.setex(cache_key, 300, json.dumps(data))
        except Exception as e:
            logger.warning(f"Redis set quota error: {e}")

        return data

    @staticmethod
    async def charge_user_quota(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        additional_gb: float
    ) -> dict:
        """Charge user quota upon subscription purchase."""
        quota = await db.scalar(select(UserQuota).where(UserQuota.user_id == user_id))
        if not quota:
            quota = UserQuota(
                user_id=user_id,
                total_quota_gb=additional_gb,
                used_quota_gb=0.0,
                remaining_quota_gb=additional_gb
            )
            db.add(quota)
        else:
            quota.total_quota_gb += additional_gb
            quota.remaining_quota_gb = max(0.0, quota.total_quota_gb - quota.used_quota_gb)

        await db.commit()
        await db.refresh(quota)

        # Invalidate cache
        await redis.delete(f"drgame:user:{user_id}:quota")
        return await QuotaService.get_user_quota(db, redis, user_id)

    @staticmethod
    async def consume_quota_from_webhook(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        game_id: int,
        bytes_downloaded: int,
        download_server_id: str,
        signature: str
    ) -> dict:
        """Consume bytes transferred via download server callback after verifying HMAC signature."""
        if not QuotaService.verify_webhook_signature(user_id, game_id, bytes_downloaded, download_server_id, signature):
            raise AuthorizationError("امضای امنیتی HMAC معتبر نیست.")

        gb_consumed = round(bytes_downloaded / (1024 ** 3), 4)

        quota = await db.scalar(select(UserQuota).where(UserQuota.user_id == user_id))
        if not quota:
            quota = UserQuota(user_id=user_id, total_quota_gb=0.0, used_quota_gb=0.0, remaining_quota_gb=0.0)
            db.add(quota)

        quota.used_quota_gb += gb_consumed
        quota.remaining_quota_gb = max(0.0, quota.total_quota_gb - quota.used_quota_gb)

        log = QuotaConsumptionLog(
            user_id=user_id,
            game_id=game_id,
            bytes_downloaded=bytes_downloaded,
            gb_deducted=gb_consumed,
            download_server_id=download_server_id
        )
        db.add(log)
        await db.commit()
        await db.refresh(quota)

        # Invalidate Redis cache
        await redis.delete(f"drgame:user:{user_id}:quota")
        return {
            "status": "success",
            "gb_deducted": gb_consumed,
            "remaining_quota_gb": round(quota.remaining_quota_gb, 2)
        }
