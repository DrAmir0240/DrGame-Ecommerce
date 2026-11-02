"""Router for Report & Analytics Department Admin (/api/admin-report).
Isolated authentication, charts, KPIs, statistics, audit logs monitoring, and report staff management.
"""
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_password, hash_password
from app.core.admin_dependencies import (
    create_department_admin_token,
    require_report_admin,
    log_admin_action,
    resolve_access_level_str,
)
from app.modules.admin.models import ReportAdmin, AdminAuditLog, AdminAccessLevel
from app.modules.admin.schemas import (
    DepartmentAdminLoginRequest,
    DepartmentAdminTokenResponse,
    DepartmentAdminInfo,
    DepartmentStaffCreate,
    DepartmentStaffUpdate,
    AdminAuditLogItem,
    AdminAuditLogListResponse,
)
from app.modules.admin.services import AdminService

router = APIRouter(prefix="/api/admin-report", tags=["Admin: Report Department"])


# --- Authentication ---

@router.post("/auth/login", response_model=DepartmentAdminTokenResponse)
async def report_admin_login(
    payload: DepartmentAdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReportAdmin).where(
        or_(
            ReportAdmin.username == payload.username_or_email,
            ReportAdmin.email == payload.username_or_email,
        )
    )
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اطلاعات ورود ادمین گزارشات نادرست است.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما غیرفعال شده است.")

    admin.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token, _, expires_at = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="report",
        access_level=resolve_access_level_str(admin.access_level),
    )

    await log_admin_action(
        db=db,
        department="report",
        admin_id=admin.id,
        admin_username=admin.username,
        action="LOGIN",
        target_entity=f"ReportAdmin:{admin.id}",
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
            department="report",
            is_active=admin.is_active,
            created_at=admin.created_at,
            last_login_at=admin.last_login_at,
        ),
    )


@router.get("/auth/me", response_model=DepartmentAdminInfo)
async def get_report_admin_profile(
    current_admin: ReportAdmin = Depends(require_report_admin()),
):
    return DepartmentAdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        mobile=current_admin.mobile,
        full_name=current_admin.full_name,
        access_level=resolve_access_level_str(current_admin.access_level),
        department="report",
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
        last_login_at=current_admin.last_login_at,
    )


# --- Staff Management ---

@router.get("/staff", response_model=List[DepartmentAdminInfo])
async def list_report_staff(
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    stmt = select(ReportAdmin).order_by(ReportAdmin.created_at.desc())
    admins = (await db.execute(stmt)).scalars().all()
    return [
        DepartmentAdminInfo(
            id=a.id,
            username=a.username,
            email=a.email,
            mobile=a.mobile,
            full_name=a.full_name,
            access_level=resolve_access_level_str(a.access_level),
            department="report",
            is_active=a.is_active,
            created_at=a.created_at,
            last_login_at=a.last_login_at,
        )
        for a in admins
    ]


@router.post("/staff", response_model=DepartmentAdminInfo, status_code=status.HTTP_201_CREATED)
async def create_report_staff(
    payload: DepartmentStaffCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReportAdmin = Depends(require_report_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    existing = await db.execute(
        select(ReportAdmin).where(or_(ReportAdmin.username == payload.username, ReportAdmin.email == payload.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام کاربری یا ایمیل تکراری است.")

    new_admin = ReportAdmin(
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
        department="report",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_STAFF",
        target_entity=f"ReportAdmin:{new_admin.id}",
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
        department="report",
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
        last_login_at=new_admin.last_login_at,
    )


@router.put("/staff/{staff_id}", response_model=DepartmentAdminInfo)
async def update_report_staff(
    staff_id: int,
    payload: DepartmentStaffUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReportAdmin = Depends(require_report_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ReportAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین گزارشات یافت نشد.")

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
        department="report",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_STAFF",
        target_entity=f"ReportAdmin:{staff.id}",
        request=request,
    )
    return DepartmentAdminInfo(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        mobile=staff.mobile,
        full_name=staff.full_name,
        access_level=resolve_access_level_str(staff.access_level),
        department="report",
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at,
    )


@router.delete("/staff/{staff_id}")
async def delete_report_staff(
    staff_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReportAdmin = Depends(require_report_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ReportAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین گزارشات یافت نشد.")
    if staff.id == current_admin.id:
        raise HTTPException(status_code=400, detail="امکان حذف حساب کاربری جاری وجود ندارد.")

    await db.delete(staff)
    await db.commit()
    await log_admin_action(
        db=db,
        department="report",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_STAFF",
        target_entity=f"ReportAdmin:{staff_id}",
        request=request,
    )
    return {"status": "success", "message": "ادمین گزارشات حذف شد."}


# --- Analytics & Summary KPIs ---

@router.get("/summary")
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    return await AdminService.get_dashboard_stats(db)


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    return await AdminService.get_dashboard_stats(db)


# --- Charts Endpoints ---

@router.get("/charts/sales")
async def get_sales_chart(
    days: int = Query(14, ge=1, le=365),
    timeframe: str = Query("daily", description="daily, weekly, or monthly"),
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    from app.modules.subscriptions.models import OrderPayment
    stmt = (
        select(
            func.date_trunc('day', OrderPayment.created_at).label('date'),
            func.sum(OrderPayment.final_price).label('amount')
        )
        .where(OrderPayment.status.in_(["paid", "success"]))
        .group_by('date')
        .order_by('date')
        .limit(days)
    )
    res = await db.execute(stmt)
    timeline = [{"date": str(r.date)[:10], "value": int(r.amount or 0)} for r in res]
    return {"chart": "sales", "days": days, "data": timeline}


@router.get("/charts/users")
async def get_users_growth_chart(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    from app.modules.users.models import User
    # Return user growth timeline
    stmt = (
        select(
            func.date_trunc('day', User.created_at).label('date'),
            func.count(User.id).label('count')
        )
        .group_by('date')
        .order_by('date')
        .limit(days)
    )
    res = await db.execute(stmt)
    timeline = [{"date": str(r.date)[:10], "users": r.count} for r in res]
    return {"chart": "users_growth", "days": days, "data": timeline}


@router.get("/charts/subscriptions")
async def get_subscriptions_distribution(
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    from app.modules.subscriptions.models import UserSubscription
    stmt = (
        select(UserSubscription.tier_code, func.count(UserSubscription.id))
        .where(UserSubscription.status == "active")
        .group_by(UserSubscription.tier_code)
    )
    res = (await db.execute(stmt)).all()
    distribution = [{"tier": r[0], "active_count": r[1]} for r in res]
    return {"chart": "subscriptions_distribution", "distribution": distribution}


@router.get("/charts/downloads")
async def get_top_downloaded_games(
    days: int = Query(14, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    from app.modules.quota.models import QuotaConsumptionLog
    stmt = (
        select(
            func.date_trunc('day', QuotaConsumptionLog.created_at).label('date'),
            func.sum(QuotaConsumptionLog.gb_deducted).label('gb')
        )
        .group_by('date')
        .order_by('date')
        .limit(days)
    )
    res = await db.execute(stmt)
    timeline = [{"date": str(r.date)[:10], "value": round(float(r.gb or 0), 2)} for r in res]
    return {"chart": "downloads", "days": days, "data": timeline}


# --- Admin Audit Logs Inspection ---

@router.get("/audit-logs", response_model=AdminAuditLogListResponse)
async def list_admin_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    department: Optional[str] = Query(None, description="content, finance, support, report, or referral"),
    action: Optional[str] = None,
    admin_username: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: ReportAdmin = Depends(require_report_admin()),
):
    query = select(AdminAuditLog)
    if department:
        query = query.where(AdminAuditLog.department == department)
    if action:
        query = query.where(AdminAuditLog.action.ilike(f"%{action}%"))
    if admin_username:
        query = query.where(AdminAuditLog.admin_username.ilike(f"%{admin_username}%"))

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    items_res = await db.execute(
        query.order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = items_res.scalars().all()

    return AdminAuditLogListResponse(
        items=[
            AdminAuditLogItem(
                id=l.id,
                department=l.department,
                admin_id=l.admin_id,
                admin_username=l.admin_username,
                action=l.action,
                target_entity=l.target_entity,
                ip_address=l.ip_address,
                user_agent=l.user_agent,
                details=l.details or {},
                created_at=l.created_at,
            )
            for l in logs
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
