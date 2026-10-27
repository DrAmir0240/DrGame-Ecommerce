"""Authentication dependency and token generation specifically for isolated admin users."""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token, create_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.modules.auth.admin_models import AdminUser

admin_bearer_scheme = HTTPBearer(auto_error=False)


def create_admin_token(admin_id: int, username: str, role: str = "superadmin") -> tuple[str, str, int]:
    """Generate JWT access token exclusively for admin users with type='admin'."""
    return create_access_token(
        subject=admin_id,
        claims={"username": username, "role": role, "type": "admin"},
    )


async def get_current_admin(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AdminUser:
    """Verify that incoming request has a valid admin JWT token and active admin profile."""
    if not auth or not auth.credentials:
        raise AuthenticationError("توکن دسترسی مدیریت ارسال نشده است.")

    token = auth.credentials
    payload = decode_token(token)

    if payload.get("type") != "admin":
        raise AuthorizationError("این توکن فاقد دسترسی مدیریت کلان است.")

    sub = payload.get("sub")
    if not sub:
        raise AuthenticationError("شناسه ادمین در توکن یافت نشد.")

    try:
        admin_id = int(sub)
    except (ValueError, TypeError):
        raise AuthenticationError("فرمت شناسه ادمین نامعتبر است.")

    stmt = select(AdminUser).where(AdminUser.id == admin_id)
    admin = (await db.execute(stmt)).scalar_one_or_none()

    if not admin:
        raise AuthenticationError("حساب کاربری مدیریت یافت نشد.")

    if not admin.is_active:
        raise AuthorizationError("حساب کاربری مدیریت غیرفعال شده است.")

    return admin
