"""Authentication dependencies and token generation for 5 isolated admin departments."""
from typing import Annotated, Callable, Any
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token, create_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.modules.admin.models import (
    AdminAccessLevel,
    ContentAdmin,
    FinanceAdmin,
    SupportAdmin,
    ReportAdmin,
    ReferralAdmin,
    AdminAuditLog,
)


admin_bearer_scheme = HTTPBearer(auto_error=False)


def create_admin_token(admin_id: int, username: str, role: str = "superadmin") -> tuple[str, str, int]:
    """Generate legacy JWT access token for legacy admin routes."""
    token, jti, expire = create_access_token(
        subject=admin_id,
        claims={"username": username, "role": role, "type": "admin"},
    )
    return token, jti, int(expire.timestamp())


def resolve_access_level_str(val: Any) -> str:
    """Safely return string representation of access level whether Enum or str."""
    if hasattr(val, "value"):
        return str(val.value)
    return str(val) if val is not None else "read_only"


def create_department_admin_token(
    admin_id: int,
    username: str,
    scope: str,
    access_level: Any,
) -> tuple[str, str, int]:
    """Generate JWT access token exclusively for specific department admin with strict scope."""
    token, jti, expire = create_access_token(
        subject=admin_id,
        claims={
            "username": username,
            "admin_scope": scope,
            "access_level": resolve_access_level_str(access_level),
            "type": "department_admin",
        },
    )
    return token, jti, int(expire.timestamp())



async def log_admin_action(
    db: AsyncSession,
    department: str,
    admin_id: int,
    admin_username: str,
    action: str,
    target_entity: str | None = None,
    details: dict | None = None,
    request: Request | None = None,
) -> AdminAuditLog:
    """Record an audit trail event for administrative operations."""
    ip = None
    ua = None
    if request:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")
    log = AdminAuditLog(
        department=department,
        admin_id=admin_id,
        admin_username=admin_username,
        action=action,
        target_entity=target_entity,
        ip_address=ip,
        user_agent=ua,
        details=details or {},
    )
    db.add(log)
    await db.commit()
    return log


def _extract_admin_payload(auth: HTTPAuthorizationCredentials | None, expected_scope: str) -> dict:
    if not auth or not auth.credentials:
        raise AuthenticationError("توکن دسترسی مدیریت ارسال نشده است.")
    payload = decode_token(auth.credentials)
    scope = payload.get("admin_scope")
    if scope != expected_scope:
        raise AuthorizationError(f"توکن ارائه‌شده فاقد دسترسی به دپارتمان {expected_scope} است.")
    return payload


# --- 1. Content Admin Dependency ---
def require_content_admin(level: AdminAccessLevel | None = None) -> Callable:
    async def dependency(
        auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> ContentAdmin:
        payload = _extract_admin_payload(auth, "content")
        admin_id = int(payload.get("sub", 0))
        admin = await db.get(ContentAdmin, admin_id)
        if not admin or not admin.is_active:
            raise AuthenticationError("حساب کاربری ادمین محتوا یافت نشد یا معلق است.")
        if level == AdminAccessLevel.FULL_CRUD and admin.access_level != AdminAccessLevel.FULL_CRUD:
            raise AuthorizationError("این عملیات نیازمند دسترسی کامل (Full-CRUD) در دپارتمان محتوا است.")
        return admin
    return dependency


# --- 2. Finance Admin Dependency ---
def require_finance_admin(level: AdminAccessLevel | None = None) -> Callable:
    async def dependency(
        auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> FinanceAdmin:
        payload = _extract_admin_payload(auth, "finance")
        admin_id = int(payload.get("sub", 0))
        admin = await db.get(FinanceAdmin, admin_id)
        if not admin or not admin.is_active:
            raise AuthenticationError("حساب کاربری ادمین مالی یافت نشد یا معلق است.")
        if level == AdminAccessLevel.FULL_CRUD and admin.access_level != AdminAccessLevel.FULL_CRUD:
            raise AuthorizationError("این عملیات نیازمند دسترسی کامل (Full-CRUD) در دپارتمان مالی است.")
        return admin
    return dependency


# --- 3. Support Admin Dependency ---
def require_support_admin(level: AdminAccessLevel | None = None) -> Callable:
    async def dependency(
        auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> SupportAdmin:
        payload = _extract_admin_payload(auth, "support")
        admin_id = int(payload.get("sub", 0))
        admin = await db.get(SupportAdmin, admin_id)
        if not admin or not admin.is_active:
            raise AuthenticationError("حساب کاربری ادمین پشتیبانی یافت نشد یا معلق است.")
        if level == AdminAccessLevel.FULL_CRUD and admin.access_level != AdminAccessLevel.FULL_CRUD:
            raise AuthorizationError("این عملیات نیازمند دسترسی کامل (Full-CRUD) در دپارتمان پشتیبانی است.")
        return admin
    return dependency


# --- 4. Report Admin Dependency ---
def require_report_admin(level: AdminAccessLevel | None = None) -> Callable:
    async def dependency(
        auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> ReportAdmin:
        payload = _extract_admin_payload(auth, "report")
        admin_id = int(payload.get("sub", 0))
        admin = await db.get(ReportAdmin, admin_id)
        if not admin or not admin.is_active:
            raise AuthenticationError("حساب کاربری ادمین گزارشات یافت نشد یا معلق است.")
        if level == AdminAccessLevel.FULL_CRUD and admin.access_level != AdminAccessLevel.FULL_CRUD:
            raise AuthorizationError("این عملیات نیازمند دسترسی کامل (Full-CRUD) در دپارتمان گزارشات است.")
        return admin
    return dependency


# --- 5. Referral Admin Dependency ---
def require_referral_admin(level: AdminAccessLevel | None = None) -> Callable:
    async def dependency(
        auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> ReferralAdmin:
        payload = _extract_admin_payload(auth, "referral")
        admin_id = int(payload.get("sub", 0))
        admin = await db.get(ReferralAdmin, admin_id)
        if not admin or not admin.is_active:
            raise AuthenticationError("حساب کاربری ادمین رفرال یافت نشد یا معلق است.")
        if level == AdminAccessLevel.FULL_CRUD and admin.access_level != AdminAccessLevel.FULL_CRUD:
            raise AuthorizationError("این عملیات نیازمند دسترسی کامل (Full-CRUD) در دپارتمان رفرال است.")
        return admin
    return dependency


# --- Fallback for backward compatibility ---
async def get_current_admin(
    auth: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify that incoming request has a valid department admin token."""
    if not auth or not auth.credentials:
        raise AuthenticationError("توکن دسترسی مدیریت ارسال نشده است.")

    token = auth.credentials
    payload = decode_token(token)

    sub = payload.get("sub")
    if not sub:
        raise AuthenticationError("شناسه ادمین در توکن یافت نشد.")

    return {"id": int(sub), "username": payload.get("username", "admin")}

