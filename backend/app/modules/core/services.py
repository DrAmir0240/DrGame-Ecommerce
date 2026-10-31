"""Service for dynamic global site settings with Redis caching."""
import json
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from app.modules.core.models import SiteSetting
from app.modules.core.schemas import SiteSettingsUpdate, SiteSettingsOut

logger = logging.getLogger("drgame.core.services")
SETTINGS_CACHE_KEY = "drgame:settings:global"
SETTINGS_CACHE_TTL = 300  # 5 minutes


class CoreSettingsService:
    @classmethod
    async def get_or_create_settings(cls, db: AsyncSession) -> SiteSetting:
        """Fetch singleton SiteSetting row or create default."""
        stmt = select(SiteSetting).where(SiteSetting.id == 1)
        setting = (await db.execute(stmt)).scalar_one_or_none()
        if not setting:
            setting = SiteSetting(id=1)
            db.add(setting)
            await db.commit()
            await db.refresh(setting)
        return setting

    @classmethod
    async def get_settings(cls, db: AsyncSession, redis: aioredis.Redis | None = None) -> SiteSettingsOut:
        """Get site settings with Redis caching."""
        if redis:
            try:
                cached = await redis.get(SETTINGS_CACHE_KEY)
                if cached:
                    return SiteSettingsOut.model_validate_json(cached)
            except Exception as e:
                logger.warning(f"Redis get settings error: {e}")

        setting = await cls.get_or_create_settings(db)
        out = SiteSettingsOut.model_validate(setting)

        if redis:
            try:
                await redis.setex(SETTINGS_CACHE_KEY, SETTINGS_CACHE_TTL, out.model_dump_json())
            except Exception as e:
                logger.warning(f"Redis set settings error: {e}")

        return out

    @classmethod
    async def update_settings(
        cls, db: AsyncSession, data: SiteSettingsUpdate, redis: aioredis.Redis | None = None
    ) -> SiteSettingsOut:
        """Update global site settings and invalidate Redis cache."""
        setting = await cls.get_or_create_settings(db)

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(setting, k, v)

        await db.commit()
        await db.refresh(setting)

        out = SiteSettingsOut.model_validate(setting)

        if redis:
            try:
                await redis.delete(SETTINGS_CACHE_KEY)
            except Exception as e:
                logger.warning(f"Redis delete settings cache error: {e}")

        return out
