"""Router for Support & User Relations Department Admin (/api/admin-support).
Isolated authentication, tickets, messages, user management, quota adjustment, and support staff management.
"""
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.security import verify_password, hash_password
from app.core.admin_dependencies import (
    create_department_admin_token,
    require_support_admin,
    log_admin_action,
    resolve_access_level_str,
)
from app.modules.admin.models import SupportAdmin, AdminAccessLevel
from app.modules.admin.schemas import (
    DepartmentAdminLoginRequest,
    DepartmentAdminTokenResponse,
    DepartmentAdminInfo,
    DepartmentStaffCreate,
    DepartmentStaffUpdate,
    AdjustQuotaRequest,
    AdminUserStatusUpdate,
)
from app.modules.admin.services import AdminService
from app.modules.tickets.models import Ticket, TicketMessage

router = APIRouter(prefix="/api/admin-support", tags=["Admin: Support Department"])


# --- Authentication ---

@router.post("/auth/login", response_model=DepartmentAdminTokenResponse)
async def support_admin_login(
    payload: DepartmentAdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SupportAdmin).where(
        or_(
            SupportAdmin.username == payload.username_or_email,
            SupportAdmin.email == payload.username_or_email,
        )
    )
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اطلاعات ورود ادمین پشتیبانی نادرست است.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما غیرفعال شده است.")

    admin.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token, _, expires_at = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="support",
        access_level=resolve_access_level_str(admin.access_level),
    )

    await log_admin_action(
        db=db,
        department="support",
        admin_id=admin.id,
        admin_username=admin.username,
        action="LOGIN",
        target_entity=f"SupportAdmin:{admin.id}",
        details={"ip": request.client.host if request.client else None},
        request=request,
    )

    return DepartmentAdminTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_at,
        admin=DepartmentAdminInfo(
            id=admin.id,
            username=admin.username,
            email=admin.email,
            mobile=admin.mobile,
            full_name=admin.full_name,
            access_level=resolve_access_level_str(admin.access_level),
            department="support",
            is_active=admin.is_active,
            created_at=admin.created_at,
            last_login_at=admin.last_login_at,
        ),
    )


@router.get("/auth/me", response_model=DepartmentAdminInfo)
async def get_support_admin_profile(
    current_admin: SupportAdmin = Depends(require_support_admin()),
):
    return DepartmentAdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        mobile=current_admin.mobile,
        full_name=current_admin.full_name,
        access_level=resolve_access_level_str(current_admin.access_level),
        department="support",
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
        last_login_at=current_admin.last_login_at,
    )


# --- Staff Management ---

@router.get("/staff", response_model=List[DepartmentAdminInfo])
async def list_support_staff(
    db: AsyncSession = Depends(get_db),
    _: SupportAdmin = Depends(require_support_admin()),
):
    stmt = select(SupportAdmin).order_by(SupportAdmin.created_at.desc())
    admins = (await db.execute(stmt)).scalars().all()
    return [
        DepartmentAdminInfo(
            id=a.id,
            username=a.username,
            email=a.email,
            mobile=a.mobile,
            full_name=a.full_name,
            access_level=resolve_access_level_str(a.access_level),
            department="support",
            is_active=a.is_active,
            created_at=a.created_at,
            last_login_at=a.last_login_at,
        )
        for a in admins
    ]


@router.post("/staff", response_model=DepartmentAdminInfo, status_code=status.HTTP_201_CREATED)
async def create_support_staff(
    payload: DepartmentStaffCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    existing = await db.execute(
        select(SupportAdmin).where(or_(SupportAdmin.username == payload.username, SupportAdmin.email == payload.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام کاربری یا ایمیل تکراری است.")

    new_admin = SupportAdmin(
        username=payload.username,
        email=payload.email,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        access_level=AdminAccessLevel(payload.access_level) if payload.access_level in ["read_only", "full_crud"] else AdminAccessLevel.READ_ONLY,
        is_active=True,
        created_by_admin_id=current_admin.id,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_STAFF",
        target_entity=f"SupportAdmin:{new_admin.id}",
        details={"created_username": new_admin.username},
        request=request,
    )

    return DepartmentAdminInfo(
        id=new_admin.id,
        username=new_admin.username,
        email=new_admin.email,
        mobile=new_admin.mobile,
        full_name=new_admin.full_name,
        access_level=resolve_access_level_str(new_admin.access_level),
        department="support",
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
        last_login_at=new_admin.last_login_at,
    )


@router.put("/staff/{staff_id}", response_model=DepartmentAdminInfo)
async def update_support_staff(
    staff_id: int,
    payload: DepartmentStaffUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(SupportAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین پشتیبانی یافت نشد.")

    if payload.full_name is not None:
        staff.full_name = payload.full_name
    if payload.mobile is not None:
        staff.mobile = payload.mobile
    if payload.access_level is not None and payload.access_level in ["read_only", "full_crud"]:
        staff.access_level = AdminAccessLevel(payload.access_level)
    if payload.is_active is not None:
        staff.is_active = payload.is_active
    if payload.password:
        staff.password_hash = hash_password(payload.password)

    await db.commit()
    await db.refresh(staff)

    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_STAFF",
        target_entity=f"SupportAdmin:{staff.id}",
        request=request,
    )
    return DepartmentAdminInfo(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        mobile=staff.mobile,
        full_name=staff.full_name,
        access_level=resolve_access_level_str(staff.access_level),
        department="support",
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at,
    )


@router.delete("/staff/{staff_id}")
async def delete_support_staff(
    staff_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(SupportAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین پشتیبانی یافت نشد.")
    if staff.id == current_admin.id:
        raise HTTPException(status_code=400, detail="امکان حذف حساب کاربری جاری وجود ندارد.")

    await db.delete(staff)
    await db.commit()
    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_STAFF",
        target_entity=f"SupportAdmin:{staff_id}",
        request=request,
    )
    return {"status": "success", "message": "ادمین پشتیبانی حذف شد."}


# --- Support Tickets Management ---

@router.get("/tickets")
async def list_support_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: SupportAdmin = Depends(require_support_admin()),
):
    query = select(Ticket)
    if status_filter:
        query = query.where(Ticket.status == status_filter)
    if priority:
        query = query.where(Ticket.priority == priority)

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    items_res = await db.execute(query.order_by(Ticket.updated_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return {
        "items": items_res.scalars().all(),
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/tickets/{ticket_id}")
async def get_support_ticket_details(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    _: SupportAdmin = Depends(require_support_admin()),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="تیکت یافت نشد.")

    messages_res = await db.execute(
        select(TicketMessage)
        .where(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at.asc())
    )
    messages = messages_res.scalars().all()
    return {
        "ticket": ticket,
        "messages": messages,
    }


@router.post("/tickets/{ticket_id}/reply")
async def reply_support_ticket(
    ticket_id: int,
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="تیکت یافت نشد.")

    message_text = payload.get("message")
    if not message_text or not str(message_text).strip():
        raise HTTPException(status_code=400, detail="متن پاسخ الزامی است.")

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_admin.id,
        sender_type="admin",
        message=message_text,
    )
    db.add(msg)
    ticket.status = "answered"
    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()

    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="REPLY_TICKET",
        target_entity=f"Ticket:{ticket_id}",
        details={"ticket_id": ticket_id},
        request=request,
    )
    return {"status": "success", "message": "پاسخ ارسال شد."}


@router.put("/tickets/{ticket_id}/status")
async def change_ticket_status(
    ticket_id: int,
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="تیکت یافت نشد.")

    new_status = payload.get("status")
    if new_status not in ["open", "in_progress", "answered", "closed"]:
        raise HTTPException(status_code=400, detail="وضعیت تیکت نامعتبر است.")

    ticket.status = new_status
    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()

    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_TICKET_STATUS",
        target_entity=f"Ticket:{ticket_id}",
        details={"status": new_status},
        request=request,
    )
    return {"status": "success", "ticket": ticket}


# --- User Management ---

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    limit: Optional[int] = Query(None, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _: SupportAdmin = Depends(require_support_admin()),
):
    effective_limit = limit or page_size or 20
    return await AdminService.list_users(
        db=db,
        page=page,
        page_size=effective_limit,
        search=search,
        is_active=is_active,
    )


@router.get("/users/{user_id}/dossier")
async def get_user_dossier(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: SupportAdmin = Depends(require_support_admin()),
):
    return await AdminService.get_user_dossier(db, user_id)


@router.post("/users/{user_id}/adjust-quota")
@router.put("/users/{user_id}/adjust-quota")
async def adjust_user_quota(
    user_id: int,
    payload: AdjustQuotaRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    added_gb = payload.effective_added_gb
    reason = payload.reason or "شارژ دستی توسط مدیریت کلان"
    res = await AdminService.adjust_user_quota(
        db=db,
        redis=redis,
        user_id=user_id,
        added_gb=added_gb,
        reason=reason,
    )
    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="ADJUST_QUOTA",
        target_entity=f"User:{user_id}",
        details={"added_gb": added_gb, "reason": reason},
        request=request,
    )
    return res


@router.patch("/users/{user_id}/status")
@router.put("/users/{user_id}/status")
async def set_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: SupportAdmin = Depends(require_support_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.update_user_status(db, user_id, payload.is_active)
    await log_admin_action(
        db=db,
        department="support",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_USER_STATUS",
        target_entity=f"User:{user_id}",
        details={"is_active": payload.is_active},
        request=request,
    )
    return res
