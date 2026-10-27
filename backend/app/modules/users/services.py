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

