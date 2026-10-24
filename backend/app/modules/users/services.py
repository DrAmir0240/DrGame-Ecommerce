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

    @staticmethod
    async def update_profile(db: AsyncSession, user_id: int, full_name: Optional[str] = None, psn_id: Optional[str] = None) -> UserProfile:
        prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
        if full_name:
            profile.display_name = full_name
        if psn_id:
            profile.gamer_tag = psn_id
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def update_avatar(db: AsyncSession, user_id: int, avatar_id: str) -> UserProfile:
        prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
        profile.avatar_url = avatar_id
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def dev_login_or_create_superuser(db: AsyncSession) -> TokenResponse:
        query = select(User).where(User.username == "admin")
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="admin@drgame.ir",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True,
            )
            db.add(user)
            await db.flush()
            profile = UserProfile(
                user_id=user.id,
                display_name="مدیر ارشد دکتر گیم",
                gamer_tag="DrGameAdmin",
                avatar_url="avatar-20",
            )
            db.add(profile)
            await db.commit()
            await db.refresh(user)
        else:
            if not user.is_superuser:
                user.is_superuser = True
                await db.commit()
                await db.refresh(user)

        token = create_access_token(subject=user.id, extra_claims={"username": user.username, "is_superuser": True})
        return TokenResponse(access_token=token, expires_in=1440 * 60)
