from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
):
    if not auth:
        return None
    token = auth.credentials
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None

    # Late import to prevent circular dependency
    from app.modules.users.models import User
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    return user


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user_optional(auth, db)
    if not user:
        raise UnauthorizedException("Invalid authentication credentials or expired token")
    if not user.is_active:
        raise UnauthorizedException("User account is inactive")
    return user


async def get_current_active_user(
    current_user = Depends(get_current_user),
):
    return current_user


async def get_current_superuser(
    current_user = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise UnauthorizedException("Superuser privileges required")
    return current_user

