from typing import Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AppException, NotFoundException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.modules.users.models import User, UserProfile
from app.modules.users.schemas import TokenResponse, UserLogin, UserOut, UserRegister


class UserService:
    @staticmethod
    async def register_user(db: AsyncSession, payload: UserRegister) -> User:
        # Check uniqueness
        query = select(User).where(
            or_(User.email == payload.email, User.username == payload.username)
        )
        existing = await db.execute(query)
        if existing.scalar_one_or_none():
            raise AppException(status_code=400, message="Username or Email already registered", code="USER_EXISTS")

        user = User(
            email=payload.email,
            username=payload.username,
            hashed_password=get_password_hash(payload.password),
        )
        db.add(user)
        await db.flush()

        profile = UserProfile(
            user_id=user.id,
            display_name=payload.display_name or payload.username,
            gamer_tag=payload.username,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(db: AsyncSession, payload: UserLogin) -> TokenResponse:
        query = select(User).where(
            or_(
                User.username == payload.username_or_email,
                User.email == payload.username_or_email,
            )
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedException("Invalid username or password")

        if not user.is_active:
            raise UnauthorizedException("User account is disabled")

        token = create_access_token(subject=user.id, extra_claims={"username": user.username})
        return TokenResponse(access_token=token, expires_in=1440 * 60)

    @staticmethod
    async def get_user_profile(db: AsyncSession, user_id: int) -> UserOut:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User not found")

        prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()

        user_out = UserOut.model_validate(user)
        if profile:
            user_out.profile = profile
        return user_out
