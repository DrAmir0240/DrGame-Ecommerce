"""User profile and session management service."""
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.exceptions import NotFoundError, BadRequestError, AuthenticationError
from app.core.security import hash_password, verify_password
from app.modules.auth.models import UserSession
from app.modules.users.models import User
from app.modules.users.schemas import (
    UserOut,
    UserProfileUpdate,
    ChangePasswordRequest,
    UserSessionOut,
)

class UserService:

    @staticmethod
    async def get_user_profile(db: AsyncSession, user_id: int) -> UserOut:
        """Fetch user by id."""
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise NotFoundError("کاربر یافت نشد.")
        return UserOut.model_validate(user)

    @staticmethod
    async def update_user_profile(
        db: AsyncSession,
        user_id: int,
        data: UserProfileUpdate
    ) -> UserOut:
        """Update profile fields such as full_name, avatar_url, hero_banner_url."""
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise NotFoundError("کاربر یافت نشد.")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)

        await db.commit()
        await db.refresh(user)
        return UserOut.model_validate(user)

    @staticmethod
    async def change_password(
        db: AsyncSession,
        user_id: int,
        data: ChangePasswordRequest
    ) -> None:
        """Verify old password and set new password."""
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise NotFoundError("کاربر یافت نشد.")

        if not verify_password(data.current_password, user.password_hash):
            raise BadRequestError("کلمه عبور فعلی نادرست است.")

        user.password_hash = hash_password(data.new_password)
        await db.commit()

    @staticmethod
    async def get_user_sessions(
        db: AsyncSession,
        user_id: int
    ) -> list[UserSessionOut]:
        """Fetch all active sessions for the user."""
        stmt = (
            select(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_active == True)
            .order_by(UserSession.last_active_at.desc())
        )
        result = await db.execute(stmt)
        sessions = result.scalars().all()
        return [UserSessionOut.model_validate(s) for s in sessions]

    @staticmethod
    async def revoke_session(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        session_id: int,
        current_jti: str | None = None,
    ) -> None:
        """Revoke a specific session by session ID and blacklist its JTI in Redis.
        Guards:
        - Primary session (is_primary=True) cannot be revoked (403 Forbidden).
        - Current session (session.jti == current_jti) cannot be revoked (403 Forbidden).
        """
        from app.core.exceptions import ForbiddenException

        session = await db.scalar(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
        )
        if not session:
            raise NotFoundError("نشست کاربری یافت نشد یا قبلاً منقضی شده است.")

        if getattr(session, "is_primary", False):
            raise ForbiddenException("امکان حذف نشست دستگاه اصلی وجود ندارد.")

        if current_jti and session.jti == current_jti:
            raise ForbiddenException("امکان خروج از نشست فعلی از این بخش وجود ندارد. لطفاً از گزینه خروج از حساب استفاده کنید.")

        session.is_active = False
        ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        await redis.setex(f"drgame:blacklist:jti:{session.jti}", ttl, "blacklisted")
        await db.commit()

    @staticmethod
    async def get_user_notifications(db: AsyncSession, user_id: int) -> dict:
        """Fetch all notifications for the user along with unread count."""
        from app.modules.users.notification_models import UserNotification
        from sqlalchemy import desc, func

        stmt = (
            select(UserNotification)
            .where(UserNotification.user_id == user_id)
            .order_by(desc(UserNotification.created_at))
        )
        res = await db.execute(stmt)
        items = list(res.scalars().all())

        unread_stmt = select(func.count(UserNotification.id)).where(
            UserNotification.user_id == user_id,
            UserNotification.is_read == False,
        )
        unread_count = (await db.execute(unread_stmt)).scalar() or 0

        return {"items": items, "unread_count": unread_count}

    @staticmethod
    async def mark_notification_read(db: AsyncSession, user_id: int, notification_id: int):
        """Mark a single notification as read."""
        from app.modules.users.notification_models import UserNotification

        stmt = select(UserNotification).where(
            UserNotification.id == notification_id,
            UserNotification.user_id == user_id,
        )
        res = await db.execute(stmt)
        notif = res.scalar_one_or_none()
        if not notif:
            raise NotFoundError("اعلان مورد نظر یافت نشد.")

        notif.is_read = True
        await db.commit()
        await db.refresh(notif)
        return notif

    @staticmethod
    async def mark_all_notifications_read(db: AsyncSession, user_id: int) -> int:
        """Mark all notifications of the user as read."""
        from app.modules.users.notification_models import UserNotification

        stmt = (
            update(UserNotification)
            .where(UserNotification.user_id == user_id, UserNotification.is_read == False)
            .values(is_read=True)
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount or 0

    @staticmethod
    async def delete_notification(db: AsyncSession, user_id: int, notification_id: int) -> None:
        """Delete a notification belonging to user."""
        from app.modules.users.notification_models import UserNotification

        stmt = select(UserNotification).where(
            UserNotification.id == notification_id,
            UserNotification.user_id == user_id,
        )
        res = await db.execute(stmt)
        notif = res.scalar_one_or_none()
        if not notif:
            raise NotFoundError("اعلان مورد نظر یافت نشد.")

        await db.delete(notif)
        await db.commit()

    @staticmethod
    async def get_user_payments(db: AsyncSession, user_id: int) -> list[dict]:
        """Fetch all payment transactions for user and format with Jalali dates."""
        from app.modules.subscriptions.models import OrderPayment
        from sqlalchemy import desc

        def to_jalali_str(dt):
            if not dt:
                return ""
            gy, gm, gd = dt.year, dt.month, dt.day
            g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
            gy2 = gy + 1 if gm > 2 else gy
            days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
            jy = -1595 + (33 * (days // 12053))
            days %= 12053
            jy += 4 * (days // 1461)
            days %= 1461
            if days > 365:
                jy += (days - 1) // 365
                days = (days - 1) % 365
            if days < 186:
                jm = 1 + (days // 31)
                jd = 1 + (days % 31)
            else:
                jm = 7 + ((days - 186) // 30)
                jd = 1 + ((days - 186) % 30)
            return f"{jy:04d}/{jm:02d}/{jd:02d} - {dt.strftime('%H:%M')}"

        tier_titles = {
            "gold": "اشتراک طلایی (VIP)",
            "silver": "اشتراک نقره‌ای (پرو)",
            "bronze": "اشتراک برنز (پایه)",
            "free": "اشتراک رایگان",
        }

        stmt = (
            select(OrderPayment)
            .where(OrderPayment.user_id == user_id)
            .order_by(desc(OrderPayment.created_at))
        )
        res = await db.execute(stmt)
        payments = res.scalars().all()

        results = []
        for p in payments:
            provider = p.payment_method or "zarinpal"
            currency = "USDT" if "crypto" in provider.lower() else "IRT"
            results.append({
                "id": p.id,
                "order_id": p.id,
                "tier_code": p.tier_code,
                "tier_title": tier_titles.get(p.tier_code.lower(), f"اشتراک {p.tier_code}"),
                "provider": provider,
                "currency": currency,
                "original_price": p.original_price,
                "discount_amount": p.discount_amount,
                "amount": p.final_price,
                "status": (p.status or "paid").upper(),
                "authority": p.transaction_ref or f"PAY-{p.id:06d}",
                "payment_id": f"TXN-{p.id:08d}",
                "created_at": p.created_at,
                "created_at_jalali": to_jalali_str(p.created_at),
            })
        return results

