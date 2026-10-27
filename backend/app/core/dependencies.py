"""FastAPI authentication dependencies and guards."""
from typing import Annotated
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.modules.users.models import User

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> User:
    """Validate Bearer JWT token, verify against Redis blacklist, and return User model."""
    if not auth or not auth.credentials:
        raise AuthenticationError("توکن احراز هویت ارسال نشده است.")

    token = auth.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise AuthenticationError("نوع توکن برای دسترسی معتبر نیست.")

    jti = payload.get("jti")
    if jti:
        is_blacklisted = await redis.get(f"drgame:blacklist:jti:{jti}")
        if is_blacklisted:
            raise AuthenticationError("این نشست کاربری باطل شده است. لطفاً دوباره وارد شوید.")

    sub = payload.get("sub")
    if not sub:
        raise AuthenticationError("شناسه کاربر در توکن یافت نشد.")

    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        raise AuthenticationError("فرمت شناسه کاربر نامعتبر است.")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("کاربر یافت نشد.")

    if not user.is_active:
        raise AuthorizationError("حساب کاربری شما غیرفعال شده است.")

    user._current_jti = jti
    return user

async def get_optional_current_user(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> User | None:
    """Return User if valid token is provided, otherwise return None without raising error."""
    if not auth or not auth.credentials:
        return None

    try:
        token = auth.credentials
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None

        jti = payload.get("jti")
        if jti:
            is_blacklisted = await redis.get(f"drgame:blacklist:jti:{jti}")
            if is_blacklisted:
                return None

        sub = payload.get("sub")
        if not sub:
            return None

        user_id = int(sub)
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None
