"""Router for Finance & Subscriptions Department Admin (/api/admin-finance).
Isolated authentication, plans, pricing, transactions, invoices, refund guarantees, and finance staff management.
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
    require_finance_admin,
    log_admin_action,
    resolve_access_level_str,
)
from app.modules.admin.models import FinanceAdmin, AdminAccessLevel
from app.modules.admin.schemas import (
    DepartmentAdminLoginRequest,
    DepartmentAdminTokenResponse,
    DepartmentAdminInfo,
    DepartmentStaffCreate,
    DepartmentStaffUpdate,
    DiscountCreateRequest,
    AdminDiscountUpdate,
    AdminManualSubscriptionGrant,
)
from app.modules.admin.services import AdminService
from app.modules.subscriptions.models import SubscriptionTier
from app.modules.subscriptions.schemas import SubscriptionTierUpdate
from app.modules.subscriptions.discount_service import UserDiscountService
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/admin-finance", tags=["Admin: Finance Department"])


# --- Authentication ---

@router.post("/auth/login", response_model=DepartmentAdminTokenResponse)
async def finance_admin_login(
    payload: DepartmentAdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FinanceAdmin).where(
        or_(
            FinanceAdmin.username == payload.username_or_email,
            FinanceAdmin.email == payload.username_or_email,
        )
    )
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اطلاعات ورود ادمین مالی نادرست است.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما غیرفعال شده است.")

    admin.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token, _, expires_at = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="finance",
        access_level=resolve_access_level_str(admin.access_level),
    )

    await log_admin_action(
        db=db,
        department="finance",
        admin_id=admin.id,
        admin_username=admin.username,
        action="LOGIN",
        target_entity=f"FinanceAdmin:{admin.id}",
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
            department="finance",
            is_active=admin.is_active,
            created_at=admin.created_at,
            last_login_at=admin.last_login_at,
        ),
    )


@router.get("/auth/me", response_model=DepartmentAdminInfo)
async def get_finance_admin_profile(
    current_admin: FinanceAdmin = Depends(require_finance_admin()),
):
    return DepartmentAdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        mobile=current_admin.mobile,
        full_name=current_admin.full_name,
        access_level=resolve_access_level_str(current_admin.access_level),
        department="finance",
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
        last_login_at=current_admin.last_login_at,
    )


# --- Staff Management ---

@router.get("/staff", response_model=List[DepartmentAdminInfo])
async def list_finance_staff(
    db: AsyncSession = Depends(get_db),
    _: FinanceAdmin = Depends(require_finance_admin()),
):
    stmt = select(FinanceAdmin).order_by(FinanceAdmin.created_at.desc())
    admins = (await db.execute(stmt)).scalars().all()
    return [
        DepartmentAdminInfo(
            id=a.id,
            username=a.username,
            email=a.email,
            mobile=a.mobile,
            full_name=a.full_name,
            access_level=resolve_access_level_str(a.access_level),
            department="finance",
            is_active=a.is_active,
            created_at=a.created_at,
            last_login_at=a.last_login_at,
        )
        for a in admins
    ]


@router.post("/staff", response_model=DepartmentAdminInfo, status_code=status.HTTP_201_CREATED)
async def create_finance_staff(
    payload: DepartmentStaffCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    existing = await db.execute(
        select(FinanceAdmin).where(or_(FinanceAdmin.username == payload.username, FinanceAdmin.email == payload.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام کاربری یا ایمیل تکراری است.")

    new_admin = FinanceAdmin(
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
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_STAFF",
        target_entity=f"FinanceAdmin:{new_admin.id}",
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
        department="finance",
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
        last_login_at=new_admin.last_login_at,
    )


@router.put("/staff/{staff_id}", response_model=DepartmentAdminInfo)
async def update_finance_staff(
    staff_id: int,
    payload: DepartmentStaffUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(FinanceAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین مالی یافت نشد.")

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
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_STAFF",
        target_entity=f"FinanceAdmin:{staff.id}",
        request=request,
    )
    return DepartmentAdminInfo(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        mobile=staff.mobile,
        full_name=staff.full_name,
        access_level=resolve_access_level_str(staff.access_level),
        department="finance",
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at,
    )


@router.delete("/staff/{staff_id}")
async def delete_finance_staff(
    staff_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(FinanceAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین مالی یافت نشد.")
    if staff.id == current_admin.id:
        raise HTTPException(status_code=400, detail="امکان حذف حساب کاربری جاری وجود ندارد.")

    await db.delete(staff)
    await db.commit()
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_STAFF",
        target_entity=f"FinanceAdmin:{staff_id}",
        request=request,
    )
    return {"status": "success", "message": "ادمین مالی حذف شد."}


# --- Subscription Plans & Pricing ---

@router.get("/plans")
async def list_subscription_plans(
    db: AsyncSession = Depends(get_db),
    _: FinanceAdmin = Depends(require_finance_admin()),
):
    stmt = select(SubscriptionTier).order_by(SubscriptionTier.id.asc())
    return (await db.execute(stmt)).scalars().all()


@router.put("/plans/{plan_id}")
async def update_subscription_plan(
    plan_id: int,
    payload: SubscriptionTierUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    plan = await db.get(SubscriptionTier, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="پلن اشتراک یافت نشد.")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(plan, k, v)
    await db.commit()
    await db.refresh(plan)

    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_PLAN",
        target_entity=f"SubscriptionTier:{plan_id}",
        details={"updated_fields": list(data.keys())},
        request=request,
    )
    return plan


# --- Transactions & Invoices ---

@router.get("/transactions")
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: FinanceAdmin = Depends(require_finance_admin()),
):
    from app.modules.wallet.models import OrderPayment
    query = select(OrderPayment)
    if status_filter:
        query = query.where(OrderPayment.status == status_filter)

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_res.scalar() or 0

    items_res = await db.execute(query.order_by(OrderPayment.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return {
        "items": items_res.scalars().all(),
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/overview")
async def get_finance_overview(
    db: AsyncSession = Depends(get_db),
    _: FinanceAdmin = Depends(require_finance_admin()),
):
    return await AdminService.get_finance_overview(db)


# --- Discount Codes Management ---

@router.get("/discounts")
async def list_discounts(db: AsyncSession = Depends(get_db), _: FinanceAdmin = Depends(require_finance_admin())):
    return await AdminService.list_discounts(db)


@router.post("/discounts", status_code=status.HTTP_201_CREATED)
async def create_discount(
    payload: DiscountCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.create_discount(db, payload)
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_DISCOUNT",
        target_entity=f"Discount:{payload.code}",
        request=request,
    )
    return res


@router.put("/discounts/{discount_id}")
async def update_discount(
    discount_id: int,
    payload: AdminDiscountUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.update_discount(db, discount_id, payload)
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_DISCOUNT",
        target_entity=f"Discount:{discount_id}",
        request=request,
    )
    return res


@router.delete("/discounts/{discount_id}")
async def delete_discount(
    discount_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.delete_discount(db, discount_id)
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_DISCOUNT",
        target_entity=f"Discount:{discount_id}",
        request=request,
    )
    return res


# --- Manual Subscription Grants ---

@router.post("/users/{user_id}/grant-subscription")
async def grant_manual_subscription(
    user_id: int,
    payload: AdminManualSubscriptionGrant,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.grant_manual_subscription(db, user_id, payload)
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="GRANT_SUBSCRIPTION",
        target_entity=f"User:{user_id}",
        details={"tier_code": payload.tier_code, "months": payload.duration_months},
        request=request,
    )
    return res


# --- Step 20: User-Bound Bulk Discounts ---

class BulkUserDiscountRequest(BaseModel):
    user_ids: List[int] = Field(..., min_length=1, description="لیست شناسه‌های کاربران هدف")
    discount_percent: int = Field(..., ge=1, le=100, description="درصد تخفیف")
    duration_days: int = Field(..., ge=1, le=365, description="مدت اعتبار تخفیف به روز")
    title: str = Field(default="تخفیف ویژه اشتراک", description="عنوان نمایشی تخفیف")
    applicable_tier_codes: Optional[List[str]] = Field(default=None, description="پلن‌های مجاز (اختیاری)")
    max_discount_toman: Optional[int] = Field(default=None, description="سقف ریالی تخفیف (اختیاری)")


@router.post("/user-discounts/bulk", status_code=status.HTTP_201_CREATED)
async def create_bulk_user_discounts(
    payload: BulkUserDiscountRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Assign promotional discounts to multiple users simultaneously (Bulk Promotion Assignment)."""
    discounts = await UserDiscountService.create_bulk_user_discounts(
        db=db,
        user_ids=payload.user_ids,
        discount_percent=payload.discount_percent,
        duration_days=payload.duration_days,
        title=payload.title,
        applicable_tier_codes=payload.applicable_tier_codes,
        max_discount_toman=payload.max_discount_toman,
        admin_id=current_admin.id,
    )
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_BULK_USER_DISCOUNTS",
        target_entity=f"BulkDiscounts:{len(discounts)}",
        details={
            "user_ids": payload.user_ids,
            "discount_percent": payload.discount_percent,
            "duration_days": payload.duration_days,
            "created_count": len(discounts),
        },
        request=request,
    )
    return {
        "status": "success",
        "created_count": len(discounts),
        "message": f"تخفیف {payload.discount_percent}٪ با موفقیت به {len(discounts)} کاربر اختصاص یافت.",
    }


@router.get("/user-discounts")
async def list_user_discounts(
    user_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    is_used: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: FinanceAdmin = Depends(require_finance_admin()),
):
    """Retrieve paginated list of user-bound discounts with status filters."""
    return await UserDiscountService.list_user_discounts(
        db=db,
        user_id=user_id,
        is_active=is_active,
        is_used=is_used,
        page=page,
        page_size=page_size,
    )


@router.delete("/user-discounts/{discount_id}")
async def cancel_user_discount(
    discount_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: FinanceAdmin = Depends(require_finance_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Deactivate or revoke an unconsumed user promotional discount."""
    res = await UserDiscountService.cancel_user_discount(db, discount_id)
    await log_admin_action(
        db=db,
        department="finance",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CANCEL_USER_DISCOUNT",
        target_entity=f"UserDiscount:{discount_id}",
        request=request,
    )
    return res
