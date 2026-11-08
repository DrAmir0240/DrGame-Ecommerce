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
from app.modules.auth.otp_service import OTPService
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
        is_email = "@" in clean_target
        is_intl = settings.DEPLOYMENT_MODE == "international"

        # Mode enforcement for OTP generation
        if settings.DEPLOYMENT_MODE == "domestic":
            if is_email:
                raise BadRequestError("در نسخه داخلی، ارسال کد فقط به شماره موبایل ایران امکان‌پذیر است.")
            clean_phone = clean_target.replace(" ", "").replace("-", "")
            if clean_phone.startswith("+98"):
                clean_phone = "0" + clean_phone[3:]
            if not re.match(r"^09\d{9}$", clean_phone):
                raise BadRequestError("فرمت شماره موبایل نامعتبر است. شماره باید ۱۱ رقمی و با ۰۹ آغاز شود.")
            clean_target = clean_phone
        elif is_intl:
            if not is_email:
                raise BadRequestError("In international mode, verification codes can only be sent to a valid email address.")
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_target):
                raise BadRequestError("Invalid email address format.")

        ratelimit_key = f"drgame:otp:ratelimit:{clean_target}"
        attempts = await redis.incr(ratelimit_key)
        if attempts == 1:
            await redis.expire(ratelimit_key, 600)  # 10 minutes rate limit window
        elif attempts > 5:
            raise BadRequestError(
                "Too many requests. Please try again in 10 minutes."
                if is_intl
                else "تعداد دفعات ارسال کد بیش از حد مجاز است. لطفاً ۱۰ دقیقه بعد مجدداً تلاش کنید."
            )

        code = f"{secrets.randbelow(900000) + 100000}"
        otp_key = f"drgame:otp:{clean_target}"
        await redis.setex(otp_key, 120, code)

        # Dispatch via unified OTP service (currently logs formatted banner)
        await OTPService.dispatch_otp(clean_target, code, settings.DEPLOYMENT_MODE)

        return code

    @staticmethod
    async def verify_otp(redis: aioredis.Redis, target: str, code: str) -> bool:
        """Verify OTP code from Redis and invalidate immediately upon verification."""
        clean_target = target.strip().lower()
        if "@" not in clean_target:
            clean_phone = clean_target.replace(" ", "").replace("-", "")
            if clean_phone.startswith("+98"):
                clean_phone = "0" + clean_phone[3:]
            elif clean_phone.startswith("0098"):
                clean_phone = "0" + clean_phone[4:]
            clean_target = clean_phone
        otp_key = f"drgame:otp:{clean_target}"
        cached_code = await redis.get(otp_key)
        is_intl = settings.DEPLOYMENT_MODE == "international"
        if not cached_code:
            raise BadRequestError(
                "Verification code has expired or was not requested."
                if is_intl
                else "کد تایید منقضی شده یا درخواست نشده است."
            )
        if cached_code != code.strip():
            raise BadRequestError(
                "Invalid verification code."
                if is_intl
                else "کد تایید وارد شده نادرست است."
            )

        await redis.delete(otp_key)
        return True

    @staticmethod
    async def register_user(
        db: AsyncSession,
        redis: aioredis.Redis,
        data: RegisterRequest,
        client_info: dict
    ) -> TokenResponse:
        """Register a new user after verifying OTP code with deployment mode rules."""
        is_intl = settings.DEPLOYMENT_MODE == "international"
        clean_target = data.target.strip().lower()
        is_email = "@" in clean_target

        if settings.DEPLOYMENT_MODE == "domestic":
            if is_email:
                raise BadRequestError("در نسخه داخلی، ثبت‌نام فقط با شماره موبایل معتبر ایران (۰۹...) امکان‌پذیر است.")
            clean_phone = clean_target.replace(" ", "").replace("-", "")
            if clean_phone.startswith("+98"):
                clean_phone = "0" + clean_phone[3:]
            if not re.match(r"^09\d{9}$", clean_phone):
                raise BadRequestError("فرمت شماره موبایل نامعتبر است. شماره باید ۱۱ رقمی و با ۰۹ شروع شود.")
            clean_target = clean_phone
            phone = clean_phone
            email = None
        else:
            if not is_email:
                raise BadRequestError("In international mode, registration is only available with a valid email address.")
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_target):
                raise BadRequestError("Invalid email address format.")
            email = clean_target
            phone = None

        await AuthService.verify_otp(redis, clean_target, data.code)

        # Validate unique username
        clean_username = data.username.strip()
        if not re.match(r"^[a-zA-Z0-9_.-]{3,50}$", clean_username):
            raise BadRequestError(
                "Username must be between 3 and 50 characters (letters, numbers, or _ . -)."
                if is_intl
                else "نام کاربری باید بین ۳ تا ۵۰ کاراکتر و شامل حروف انگلیسی، اعداد یا کاراکترهای _ . - باشد."
            )

        existing_username = await db.scalar(
            select(User).where(User.username == clean_username)
        )
        if existing_username:
            raise ConflictError(
                "This username is already taken. Please choose another."
                if is_intl
                else "این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید."
            )

        if email:
            existing_email = await db.scalar(select(User).where(User.email == email))
            if existing_email:
                raise ConflictError(
                    "This email address is already registered."
                    if is_intl
                    else "این آدرس ایمیل قبلاً ثبت شده است."
                )
        if phone:
            existing_phone = await db.scalar(select(User).where(User.phone == phone))
            if existing_phone:
                raise ConflictError(
                    "This phone number is already registered."
                    if is_intl
                    else "این شماره موبایل قبلاً ثبت شده است."
                )

        user = User(
            full_name=data.full_name.strip() or ("DrGame Gamer" if is_intl else "کاربر دکتر گیم"),
            username=clean_username,
            email=email,
            phone=phone,
            password_hash=hash_password(data.password),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Create wallet with default currency
        from app.modules.wallet.models import UserWallet
        from app.modules.wallet.services import WalletService
        wallet = UserWallet(
            user_id=user.id,
            currency=settings.DEFAULT_CURRENCY,
            withdrawable_balance_toman=0,
            pending_balance_toman=0,
            total_earned_toman=0,
            total_withdrawn_toman=0,
        )
        db.add(wallet)
        await db.commit()

        # Bind referral if referral code provided
        if data.referral_code and data.referral_code.strip():
            await WalletService.bind_referral(db, user.id, data.referral_code.strip())

        return await AuthService.create_user_session(db, user, client_info)

    @staticmethod
    async def login_with_password(
        db: AsyncSession,
        data: PasswordLoginRequest,
        client_info: dict
    ) -> TokenResponse:
        """Authenticate user with username/email/phone and bcrypt password."""
        clean_login = data.login.strip().lower()
        is_intl = settings.DEPLOYMENT_MODE == "international"
        stmt = select(User).where(
            (User.username.ilike(clean_login)) |
            (User.email.ilike(clean_login)) |
            (User.phone == clean_login)
        )
        user = await db.scalar(stmt)
        if not user or not verify_password(data.password, user.password_hash):
            raise AuthenticationError(
                "Invalid username, email, or password."
                if is_intl
                else "نام کاربری یا کلمه عبور وارد شده نادرست است."
            )

        if not user.is_active:
            raise AuthorizationError(
                "Your account has been suspended."
                if is_intl
                else "حساب کاربری شما مسدود شده است."
            )

        return await AuthService.create_user_session(db, user, client_info)

    @staticmethod
    async def login_with_otp(
        db: AsyncSession,
        redis: aioredis.Redis,
        data,
        client_info: dict,
    ) -> TokenResponse:
        """Authenticate existing user with verified OTP code, or auto-create account if not found."""
        clean_target = data.target.strip().lower()
        if "@" not in clean_target:
            clean_phone = clean_target.replace(" ", "").replace("-", "")
            if clean_phone.startswith("+98"):
                clean_phone = "0" + clean_phone[3:]
            elif clean_phone.startswith("0098"):
                clean_phone = "0" + clean_phone[4:]
            clean_target = clean_phone

        is_intl = settings.DEPLOYMENT_MODE == "international"
        await AuthService.verify_otp(redis, clean_target, data.code)

        is_email = "@" in clean_target
        if is_email:
            user = await db.scalar(select(User).where(User.email == clean_target))
        else:
            user = await db.scalar(select(User).where(User.phone == clean_target))

        if not user:
            # Auto-register new user seamlessly
            import uuid
            default_username = f"user_{uuid.uuid4().hex[:8]}"
            user = User(
                full_name="DrGame Gamer" if is_intl else "کاربر دکتر گیم",
                username=default_username,
                email=clean_target if is_email else None,
                phone=None if is_email else clean_target,
                password_hash=hash_password(uuid.uuid4().hex),
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            from app.modules.wallet.models import UserWallet
            from app.modules.wallet.services import WalletService
            wallet = UserWallet(
                user_id=user.id,
                currency=settings.DEFAULT_CURRENCY,
                withdrawable_balance_toman=0,
                pending_balance_toman=0,
                total_earned_toman=0,
                total_withdrawn_toman=0,
            )
            db.add(wallet)
            await db.commit()

            ref_code = getattr(data, "referral_code", None)
            if ref_code and ref_code.strip():
                await WalletService.bind_referral(db, user.id, ref_code.strip())

        if not user.is_active:
            raise AuthorizationError(
                "Your account has been suspended."
                if is_intl
                else "حساب کاربری شما مسدود شده است."
            )

        return await AuthService.create_user_session(db, user, client_info)


    @staticmethod
    async def login_with_console_code(
        db: AsyncSession,
        redis: aioredis.Redis,
        console_code: str,
        client_info: dict
    ) -> TokenResponse:
        """Authenticate console user with dynamic 2-minute pairing code or fallback."""
        clean_code = console_code.strip().upper()
        is_intl = settings.DEPLOYMENT_MODE == "international"

        # 1. Check dynamic pairing code in Redis first (primary flow)
        pair_key = f"drgame:console_pair:{clean_code}"
        user_id_raw = await redis.get(pair_key)
        user = None
        if user_id_raw:
            user_id = int(user_id_raw.decode() if isinstance(user_id_raw, bytes) else user_id_raw)
            user = await db.get(User, user_id)
            # Atomically invalidate pairing code immediately upon use
            await redis.delete(pair_key)

        # 2. Fallback to static console_auth_code if exists
        if not user:
            user = await db.scalar(select(User).where(User.console_auth_code == clean_code))

        if not user:
            raise AuthenticationError(
                "Invalid or expired console pairing code."
                if is_intl
                else "کد اتصال کنسول نامعتبر است یا زمان ۲ دقیقه‌ای آن منقضی شده است."
            )

        if not user.is_active:
            raise AuthorizationError(
                "Your account has been suspended."
                if is_intl
                else "حساب کاربری شما مسدود شده است."
            )

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
            err_msg = (
                "Invalid refresh token type."
                if settings.DEPLOYMENT_MODE == "international"
                else "توکن ارسال شده از نوع Refresh نیست."
            )
            raise AuthenticationError(err_msg)

        user_id = int(payload["sub"])
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user or not user.is_active:
            err_msg = (
                "User not found or inactive."
                if settings.DEPLOYMENT_MODE == "international"
                else "کاربر یافت نشد یا غیرفعال است."
            )
            raise AuthenticationError(err_msg)

        return await AuthService.create_user_session(db, user, client_info)
