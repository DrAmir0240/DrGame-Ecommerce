from datetime import datetime
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.quota.schemas import QuotaStatusOut
from app.modules.subscriptions.models import SubscriptionTier, UserSubscription
from app.modules.users.models import User


class QuotaService:
    @staticmethod
    async def get_user_quota_status(db: AsyncSession, user: Optional[User]) -> QuotaStatusOut:
        if not user:
            return QuotaStatusOut(
                user_id=None,
                has_active_subscription=False,
                formatted_pill_text="GB 0",
                remaining_quota_gb=0.0,
            )

        now = datetime.utcnow()
        query = (
            select(UserSubscription)
            .where(
                UserSubscription.user_id == user.id,
                UserSubscription.is_active == True,
                UserSubscription.expires_at > now,
            )
            .order_by(UserSubscription.id.desc())
        )
        res = await db.execute(query)
        sub = res.scalar_one_or_none()

        if not sub:
            return QuotaStatusOut(
                user_id=user.id,
                has_active_subscription=False,
                formatted_pill_text="GB 0",
                remaining_quota_gb=0.0,
            )

        tier_res = await db.execute(select(SubscriptionTier).where(SubscriptionTier.id == sub.tier_id))
        tier = tier_res.scalar_one_or_none()
        tier_name = tier.name if tier else "Active Plan"
        tier_slug = tier.slug if tier else "active"

        rem_bytes = max(0, sub.total_quota_bytes - sub.used_quota_bytes)
        total_gb = round(sub.total_quota_bytes / (1024 * 1024 * 1024), 1)
        used_gb = round(sub.used_quota_bytes / (1024 * 1024 * 1024), 1)
        rem_gb = round(rem_bytes / (1024 * 1024 * 1024), 1)
        pct = round((sub.used_quota_bytes / sub.total_quota_bytes * 100), 1) if sub.total_quota_bytes > 0 else 0.0

        if total_gb >= 1000:
            formatted = f"{int(rem_gb)} GB / {total_gb / 1000:.1f} TB"
        else:
            formatted = f"{int(rem_gb)} GB / {int(total_gb)} GB"

        return QuotaStatusOut(
            user_id=user.id,
            has_active_subscription=True,
            tier_name=tier_name,
            tier_slug=tier_slug,
            total_quota_bytes=sub.total_quota_bytes,
            used_quota_bytes=sub.used_quota_bytes,
            remaining_quota_bytes=rem_bytes,
            total_quota_gb=total_gb,
            used_quota_gb=used_gb,
            remaining_quota_gb=rem_gb,
            used_percentage=pct,
            formatted_pill_text=formatted,
            is_exhausted=rem_bytes <= 0,
        )
