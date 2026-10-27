"""Scheduled reminder cron job: 3-day subscription expiry and 10% remaining quota alerts."""
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.subscriptions.models import UserSubscription
from app.modules.quota.models import UserQuota
from app.modules.users.notification_models import UserNotification

logger = logging.getLogger("drgame.cron.reminders")


async def run_expiry_and_quota_reminder_job(db: AsyncSession) -> dict:
    """
    Periodic job to detect and notify users whose:
    1. Active paid subscription expires within 3 days.
    2. Remaining download quota is 10% or less of total quota.
    Inserts audit notifications into user_notifications table.
    """
    now = datetime.now(timezone.utc)
    three_days_later = now + timedelta(days=3)
    one_day_ago = now - timedelta(days=1)
    three_days_ago = now - timedelta(days=3)

    expiry_notifications_sent = 0
    quota_notifications_sent = 0

    # 1. Check subscriptions expiring within 3 days
    subs_stmt = select(UserSubscription).where(
        UserSubscription.status == "active",
        UserSubscription.tier_code != "free",
        UserSubscription.end_date > now,
        UserSubscription.end_date <= three_days_later,
    )
    expiring_subs = list((await db.execute(subs_stmt)).scalars().all())

    for sub in expiring_subs:
        # Check if reminder was already sent in the last 3 days
        existing_stmt = select(UserNotification).where(
            UserNotification.user_id == sub.user_id,
            UserNotification.notification_type == "expiry_reminder",
            UserNotification.created_at >= three_days_ago,
        )
        already_sent = (await db.execute(existing_stmt)).scalar_one_or_none()
        if not already_sent:
            days_left = max(1, (sub.end_date - now).days)
            notification = UserNotification(
                user_id=sub.user_id,
                title="یادآوری تمدید اشتراک",
                message=f"اشتراک {sub.tier_code} شما تا {days_left} روز دیگر منقضی خواهد شد. لطفاً جهت جلوگیری از قطع دسترسی، نسبت به تمدید اقدام فرمایید.",
                notification_type="expiry_reminder",
                is_read=False,
            )
            db.add(notification)
            expiry_notifications_sent += 1

    # 2. Check users with 10% or less remaining quota
    quota_stmt = select(UserQuota).where(
        UserQuota.total_quota_gb > 0,
        UserQuota.remaining_quota_gb <= (UserQuota.total_quota_gb * 0.10),
    )
    low_quotas = list((await db.execute(quota_stmt)).scalars().all())

    for q in low_quotas:
        # Check if reminder was already sent in the last 24 hours
        existing_stmt = select(UserNotification).where(
            UserNotification.user_id == q.user_id,
            UserNotification.notification_type == "quota_reminder",
            UserNotification.created_at >= one_day_ago,
        )
        already_sent = (await db.execute(existing_stmt)).scalar_one_or_none()
        if not already_sent:
            percent_left = round((q.remaining_quota_gb / q.total_quota_gb) * 100, 1)
            notification = UserNotification(
                user_id=q.user_id,
                title="هشدار اتمام سهمیه دانلود",
                message=f"تنها {q.remaining_quota_gb:.1f} گیگابایت ({percent_left}٪) از سهمیه دانلودی شما باقی مانده است. برای افزایش حجم می‌توانید پلن خود را ارتقا دهید.",
                notification_type="quota_reminder",
                is_read=False,
            )
            db.add(notification)
            quota_notifications_sent += 1

    await db.commit()
    logger.info(
        "Reminder job completed: %d expiry alerts, %d quota alerts",
        expiry_notifications_sent,
        quota_notifications_sent,
    )
    return {
        "status": "success",
        "expiry_notifications_sent": expiry_notifications_sent,
        "quota_notifications_sent": quota_notifications_sent,
        "checked_at": now.isoformat(),
    }
