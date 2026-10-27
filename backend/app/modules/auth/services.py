"""Authentication service business logic: OTP, password login, console login, session management."""
import re
import secrets
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    BadRequestError,
    ConflictError,
    NotFoundError,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.modules.auth.models import UserSession
from app.modules.auth.schemas import (
    RegisterRequest,
    PasswordLoginRequest,
    TokenResponse,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserOut

def detect_device_info(user_agent: str | None) -> tuple[str, str]:
    """Detect device name and device type (console, mobile, desktop) from user-agent."""
    if not user_agent:
        return "Unknown Device", "desktop"

    ua = user_agent.lower()
    if "playstation" in ua or "ps5" in ua or "ps4" in ua:
        if "playstation 5" in ua or "ps5" in ua:
            return "PlayStation 5 Browser", "console"
        return "PlayStation 4 Browser", "console"
    if "xbox" in ua:
        return "Xbox Console Browser", "console"
    if "nintendo switch" in ua:
        return "Nintendo Switch Browser", "console"
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        if "iphone" in ua:
            return "Apple iPhone Safari", "mobile"
        return "Mobile Browser", "mobile"
    if "macintosh" in ua:
        return "Apple Mac Browser", "desktop"
    if "windows" in ua:
        return "Windows PC Browser", "desktop"
    if "linux" in ua:
        return "Linux PC Browser", "desktop"

    return "Web Browser", "desktop"

class AuthService:

    @staticmethod
    async def generate_and_save_otp(redis: aioredis.Redis, target: str) -> str:
        """Generate 6-digit OTP, apply rate limiting, and cache in Redis with 120s TTL."""
        clean_target = target.strip().lower()
        ratelimit_key = f"drgame:otp:ratelimit:{clean_target}"
        attempts = await redis.incr(ratelimit_key)
        if attempts == 1:
            await redis.expire(ratelimit_key, 600)  # 10 minutes rate limit window
        elif attempts > 5:
            raise BadRequestError("تعداد دفعات ارسال کد بیش از حد مجاز است. لطفاً ۱۰ دقیقه بعد مجدداً تلاش کنید.")

        code = f"{secrets.randbelow(900000) + 100000}"
        otp_key = f"drgame:otp:{clean_target}"
        await redis.setex(otp_key, 120, code)
        return code

    @staticmethod
    async def verify_otp(redis: aioredis.Redis, target: str, code: str) -> bool:
        """Verify OTP code from Redis and invalidate immediately upon verification."""
        clean_target = target.strip().lower()
        otp_key = f"drgame:otp:{clean_target}"
        cached_code = await redis.get(otp_key)
        if not cached_code:
            raise BadRequestError("کد تایید منقضی شده یا درخواست نشده است.")
        if cached_code != code.strip():
            raise BadRequestError("کد تایید وارد شده نادرست است.")

        await redis.delete(otp_key)
        return True

    @staticmethod
    async def register_user(
        db: AsyncSession,
        redis: aioredis.Redis,
        data: RegisterRequest,
        client_info: dict
    ) -> TokenResponse:
        """Register a new user after verifying OTP code."""
        clean_target = data.target.strip().lower()
        await AuthService.verify_otp(redis, clean_target, data.code)

        # Check existing username
        existing_username = await db.scalar(
            select(User).where(User.username == data.username.strip())
        )
        if existing_username:
            raise ConflictError("این نام کاربری قبلاً ثبت شده است.")

        is_email = "@" in clean_target
        email = clean_target if is_email else None
        phone = None if is_email else clean_target

        if email:
            existing_email = await db.scalar(select(User).where(User.email == email))
            if existing_email:
                raise ConflictError("این آدرس ایمیل قبلاً ثبت شده است.")
        if phone:
            existing_phone = await db.scalar(select(User).where(User.phone == phone))
            if existing_phone:
                raise ConflictError("این شماره موبایل قبلاً ثبت شده است.")

        user = User(
            full_name=data.full_name.strip(),
            username=data.username.strip(),
            email=email,
            phone=phone,
            password_hash=hash_password(data.password),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return await AuthService.create_user_session(db, user, client_info)

    @staticmethod
    async def login_with_password(
        db: AsyncSession,
        data: PasswordLoginRequest,
        client_info: dict
    ) -> TokenResponse:
        """Authenticate user with username/email/phone and bcrypt password."""
        clean_login = data.login.strip().lower()
        stmt = select(User).where(
            (User.username.ilike(clean_login)) |
            (User.email.ilike(clean_login)) |
            (User.phone == clean_login)
        )
        user = await db.scalar(stmt)
        if not user or not verify_password(data.password, user.password_hash):
            raise AuthenticationError("نام کاربری یا کلمه عبور وارد شده نادرست است.")

        if not user.is_active:
            raise AuthorizationError("حساب کاربری شما مسدود شده است.")

        return await AuthService.create_user_session(db, user, client_info)

    @staticmethod
    async def login_with_console_code(
        db: AsyncSession,
        console_code: str,
        client_info: dict
    ) -> TokenResponse:
        """Authenticate console user with 7-digit persistent alphanumeric code."""
        clean_code = console_code.strip().upper()
        user = await db.scalar(select(User).where(User.console_auth_code == clean_code))
        if not user:
            raise AuthenticationError("کد ورود ۷ رقمی کنسول نامعتبر است.")

        if not user.is_active:
            raise AuthorizationError("حساب کاربری شما مسدود شده است.")

        # Override device type to console
        client_info["device_type"] = "console"
        if not client_info.get("device_name") or client_info.get("device_name") == "Web Browser":
            client_info["device_name"] = "PlayStation Console Browser"

        return await AuthService.create_user_session(db, user, client_info)

    @staticmethod
    async def create_user_session(
        db: AsyncSession,
        user: User,
        client_info: dict
    ) -> TokenResponse:
        """Issue JWT tokens and create active session record."""
        access_token, access_jti, access_exp = create_access_token(
            subject=user.id,
            claims={"username": user.username}
        )
        refresh_token, refresh_jti, refresh_exp = create_refresh_token(subject=user.id)

        # Check if user already has an active primary session
        has_primary_stmt = select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.is_active == True,
            UserSession.is_primary == True,
        )
        existing_primary = (await db.execute(has_primary_stmt)).scalar_one_or_none()
        is_primary = False
        if not existing_primary:
            is_primary = True

        session = UserSession(
            user_id=user.id,
            jti=access_jti,
            device_name=client_info.get("device_name", "Web Browser"),
            device_type=client_info.get("device_type", "desktop"),
            ip_address=client_info.get("ip_address"),
            user_agent=client_info.get("user_agent"),
            is_active=True,
            is_primary=is_primary,
            last_active_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        db.add(session)
        await db.commit()

        expires_in = int((access_exp - datetime.now(timezone.utc)).total_seconds())

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserOut.model_validate(user)
        )

    @staticmethod
    async def logout_user(
        db: AsyncSession,
        redis: aioredis.Redis,
        jti: str,
        user_id: int
    ) -> None:
        """Blacklist current token JTI in Redis and deactivate database session."""
        ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        await redis.setex(f"drgame:blacklist:jti:{jti}", ttl, "blacklisted")

        await db.execute(
            update(UserSession)
            .where(UserSession.jti == jti, UserSession.user_id == user_id)
            .values(is_active=False)
        )
        await db.commit()

    @staticmethod
    async def refresh_user_token(
        db: AsyncSession,
        refresh_token: str,
        client_info: dict
    ) -> TokenResponse:
        """Validate refresh token and issue new token pair."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthenticationError("توکن ارسال شده از نوع Refresh نیست.")

        user_id = int(payload["sub"])
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user or not user.is_active:
            raise AuthenticationError("کاربر یافت نشد یا غیرفعال است.")

        return await AuthService.create_user_session(db, user, client_info)
