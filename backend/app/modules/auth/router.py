"""Authentication router: OTP, registration, password login, console login, logout."""
from typing import Annotated
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.modules.auth.schemas import (
    OTPRequest,
    RegisterRequest,
    PasswordLoginRequest,
    OTPLoginRequest,
    ConsoleLoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    MessageResponse,
)
from app.modules.auth.services import AuthService, detect_device_info
from app.modules.users.models import User

router = APIRouter(tags=["Authentication"])

def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set secure HttpOnly cookies for customer JWT tokens."""
    is_prod = settings.DEPLOYMENT_MODE == "production"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=is_prod,
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=is_prod,
        path="/api/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

def clear_auth_cookies(response: Response) -> None:
    """Clear access and refresh token cookies on logout."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth")

def extract_client_info(request: Request) -> dict:
    """Extract IP and User-Agent from incoming request."""
    user_agent = request.headers.get("user-agent", "")
    device_name, device_type = detect_device_info(user_agent)

    # Respect X-Forwarded-For if behind proxy
    forwarded_for = request.headers.get("x-forwarded-for")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else None)

    return {
        "device_name": device_name,
        "device_type": device_type,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }

@router.post("/otp/send", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def send_otp(
    payload: OTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)]
):
    """Send 6-digit OTP code to email or mobile (cached in Redis with 120s TTL) and detect if user exists."""
    code = await AuthService.generate_and_save_otp(redis, payload.target)

    # Check if target already belongs to an existing registered user
    clean_target = payload.target.strip().lower()
    if "@" in clean_target:
        stmt = select(User).where(User.email.ilike(clean_target))
    else:
        clean_phone = clean_target.replace(" ", "").replace("-", "")
        if clean_phone.startswith("+98"):
            clean_phone = "0" + clean_phone[3:]
        stmt = select(User).where(User.phone == clean_phone)

    user = await db.scalar(stmt)
    is_registered = user is not None

    message_text = (
        "Verification code sent successfully."
        if settings.DEPLOYMENT_MODE == "international"
        else "کد تایید ۶ رقمی با موفقیت ارسال شد."
    )
    return MessageResponse(
        message=message_text,
        detail=f"DEBUG_CODE: {code}",
        is_registered=is_registered
    )

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Register new user with verified OTP code and return JWT tokens (with HttpOnly cookies)."""
    client_info = extract_client_info(request)
    tokens = await AuthService.register_user(db, redis, payload, client_info)
    set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return tokens

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    payload: PasswordLoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate with username/email/phone and password (with HttpOnly cookies)."""
    client_info = extract_client_info(request)
    tokens = await AuthService.login_with_password(db, payload, client_info)
    set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return tokens

@router.post("/login/otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_otp(
    payload: OTPLoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Authenticate with verified OTP code (passwordless login with HttpOnly cookies)."""
    client_info = extract_client_info(request)
    tokens = await AuthService.login_with_otp(db, redis, payload, client_info)
    set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return tokens


@router.post("/login/console", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login_console(
    payload: ConsoleLoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Authenticate console browser via dynamic 2-minute pairing code or persistent code."""
    client_info = extract_client_info(request)
    tokens = await AuthService.login_with_console_code(db, redis, payload.console_code, client_info)
    set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return tokens

@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Issue new token pair using refresh token from payload or cookie."""
    token_str = payload.refresh_token or request.cookies.get("refresh_token")
    if not token_str:
        from app.core.exceptions import AuthenticationError
        raise AuthenticationError("توکن رفرش ارسال نشده است.")
    client_info = extract_client_info(request)
    tokens = await AuthService.refresh_user_token(db, token_str, client_info)
    set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return tokens

@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Logout current user, blacklist active access token JTI, and clear auth cookies."""
    auth_header = request.headers.get("authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if auth_header else request.cookies.get("access_token", "")
    if token:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if jti:
                await AuthService.logout_user(db, redis, jti, current_user.id)
        except Exception:
            pass
    clear_auth_cookies(response)
    msg = (
        "Logged out successfully."
        if settings.DEPLOYMENT_MODE == "international"
        else "خروج از حساب کاربری با موفقیت انجام شد."
    )
    return MessageResponse(message=msg)
