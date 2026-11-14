"""Router for Referral & Partner Payout Department Admin (/api/admin-referral).
Isolated authentication, referral network tree, settlement accounts, payout processing, and referral staff management.
"""
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.security import verify_password, hash_password
import redis.asyncio as aioredis
from app.core.admin_dependencies import (
    create_department_admin_token,
    require_referral_admin,
    log_admin_action,
    resolve_access_level_str,
)
from app.modules.admin.models import ReferralAdmin, AdminAccessLevel
from app.modules.admin.schemas import (
    DepartmentAdminLoginRequest,
    DepartmentAdminTokenResponse,
    DepartmentAdminInfo,
    DepartmentStaffCreate,
    DepartmentStaffUpdate,
    ProcessPayoutRequest,
    VerifyAccountRequest,
    ReleaseSelectedCommissionsRequest,
)
from app.modules.admin.services import AdminService
from app.modules.wallet.models import SettlementAccount, ReferralChain
from app.modules.wallet.services import WalletService
from app.modules.wallet.settlement_service import WeeklySettlementService
from app.modules.users.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin-referral", tags=["Admin: Referral Department"])


# --- Authentication ---

@router.post("/auth/login", response_model=DepartmentAdminTokenResponse)
async def referral_admin_login(
    payload: DepartmentAdminLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ReferralAdmin).where(
        or_(
            ReferralAdmin.username == payload.username_or_email,
            ReferralAdmin.email == payload.username_or_email,
        )
    )
    admin = (await db.execute(stmt)).scalar_one_or_none()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="اطلاعات ورود ادمین رفرال نادرست است.")

    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="حساب کاربری شما غیرفعال شده است.")

    admin.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token, _, expires_at = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="referral",
        access_level=resolve_access_level_str(admin.access_level),
    )

    await log_admin_action(
        db=db,
        department="referral",
        admin_id=admin.id,
        admin_username=admin.username,
        action="LOGIN",
        target_entity=f"ReferralAdmin:{admin.id}",
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
            department="referral",
            is_active=admin.is_active,
            created_at=admin.created_at,
            last_login_at=admin.last_login_at,
        ),
    )


@router.get("/auth/me", response_model=DepartmentAdminInfo)
async def get_referral_admin_profile(
    current_admin: ReferralAdmin = Depends(require_referral_admin()),
):
    return DepartmentAdminInfo(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        mobile=current_admin.mobile,
        full_name=current_admin.full_name,
        access_level=resolve_access_level_str(current_admin.access_level),
        department="referral",
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
        last_login_at=current_admin.last_login_at,
    )


# --- Staff Management ---

@router.get("/staff", response_model=List[DepartmentAdminInfo])
async def list_referral_staff(
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    stmt = select(ReferralAdmin).order_by(ReferralAdmin.created_at.desc())
    admins = (await db.execute(stmt)).scalars().all()
    return [
        DepartmentAdminInfo(
            id=a.id,
            username=a.username,
            email=a.email,
            mobile=a.mobile,
            full_name=a.full_name,
            access_level=resolve_access_level_str(a.access_level),
            department="referral",
            is_active=a.is_active,
            created_at=a.created_at,
            last_login_at=a.last_login_at,
        )
        for a in admins
    ]


@router.post("/staff", response_model=DepartmentAdminInfo, status_code=status.HTTP_201_CREATED)
async def create_referral_staff(
    payload: DepartmentStaffCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    existing = await db.execute(
        select(ReferralAdmin).where(or_(ReferralAdmin.username == payload.username, ReferralAdmin.email == payload.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام کاربری یا ایمیل تکراری است.")

    new_admin = ReferralAdmin(
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
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="CREATE_STAFF",
        target_entity=f"ReferralAdmin:{new_admin.id}",
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
        department="referral",
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
        last_login_at=new_admin.last_login_at,
    )


@router.put("/staff/{staff_id}", response_model=DepartmentAdminInfo)
async def update_referral_staff(
    staff_id: int,
    payload: DepartmentStaffUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ReferralAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین رفرال یافت نشد.")

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
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_STAFF",
        target_entity=f"ReferralAdmin:{staff.id}",
        request=request,
    )
    return DepartmentAdminInfo(
        id=staff.id,
        username=staff.username,
        email=staff.email,
        mobile=staff.mobile,
        full_name=staff.full_name,
        access_level=resolve_access_level_str(staff.access_level),
        department="referral",
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at,
    )


@router.delete("/staff/{staff_id}")
async def delete_referral_staff(
    staff_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    staff = await db.get(ReferralAdmin, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="ادمین رفرال یافت نشد.")
    if staff.id == current_admin.id:
        raise HTTPException(status_code=400, detail="امکان حذف حساب کاربری جاری وجود ندارد.")

    await db.delete(staff)
    await db.commit()
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="DELETE_STAFF",
        target_entity=f"ReferralAdmin:{staff_id}",
        request=request,
    )
    return {"status": "success", "message": "ادمین رفرال حذف شد."}


# --- Referral Overview & Global User Search ---

@router.get("/overview")
async def get_referral_overview(
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Unified live overview metrics and urgent action queues for Referral Department."""
    return await WeeklySettlementService.get_referral_overview(db)


@router.get("/users/search")
async def search_referral_users(
    q: str = Query("", description="جستجو با نام، یوزرنیم، موبایل، کد رفرال، کد ملی یا شناسه"),
    limit: int = Query(15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Global user autocomplete search for chain explorer, blacklist, and treasury actions."""
    return await WeeklySettlementService.search_users(db, q=q, limit=limit)


# --- Referral Chains & Trees ---

@router.get("/chains")
async def list_referral_chains(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    limit: Optional[int] = Query(None, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query("all"),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    effective_size = limit or page_size
    return await WeeklySettlementService.list_admin_chains_enriched(
        db=db,
        page=page,
        limit=effective_size,
        search=search,
        status_filter=status_filter,
    )


# --- Settlement Accounts ---

@router.get("/settlement-accounts")
async def list_settlement_accounts(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    verified_filter: str = Query("all"),
    account_type: str = Query("all"),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    return await AdminService.list_settlement_accounts_paginated(
        db=db,
        page=page,
        limit=limit,
        search=search,
        verified_filter=verified_filter,
        account_type=account_type,
    )


@router.put("/settlement-accounts/{account_id}/verify")
async def verify_settlement_account(
    account_id: int,
    payload: VerifyAccountRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Approve or revoke verification of a user's bank/crypto settlement account."""
    res = await AdminService.verify_settlement_account(db, account_id, payload.is_verified)
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="VERIFY_SETTLEMENT_ACCOUNT",
        target_entity=f"SettlementAccount:{account_id}",
        details={"is_verified": payload.is_verified},
        request=request,
    )
    return res


# --- Payout Requests Management ---

@router.get("/payouts")
async def list_payout_requests(
    status_filter: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    effective_status = status_filter if status_filter is not None else status
    return await AdminService.list_payout_requests_paginated(
        db=db,
        status_filter=effective_status,
        search=search,
        page=page,
        limit=limit,
    )


@router.post("/payouts/{request_id}/process")
async def process_payout_request(
    request_id: int,
    payload: ProcessPayoutRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    res = await AdminService.process_payout_request(
        db=db,
        request_id=request_id,
        new_status=payload.new_status,
        admin_receipt_url=payload.admin_receipt_url,
        admin_notes=payload.admin_notes,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="PROCESS_PAYOUT",
        target_entity=f"Payout:{request_id}",
        details={
            "new_status": payload.new_status,
            "admin_receipt_url": payload.admin_receipt_url,
            "admin_notes": payload.admin_notes,
        },
        request=request,
    )
    return res


# --- Step 20 & 28: Weekly Settlement Center ---

@router.get("/settlement/preview")
async def preview_weekly_settlement(
    search: Optional[str] = Query(None),
    sort_by: str = Query("amount_desc"),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Preview pending commission amounts and beneficiaries before executing settlement."""
    return await WeeklySettlementService.preview_weekly_settlement(db, search=search, sort_by=sort_by)


@router.post("/settlement/execute")
async def execute_weekly_settlement(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Execute weekly batch settlement, credit user wallets, and mark ledgers as settled."""
    res = await WeeklySettlementService.execute_weekly_settlement(
        db=db,
        executed_by_admin_id=current_admin.id,
        executed_by_type="admin",
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="EXECUTE_WEEKLY_SETTLEMENT",
        target_entity=f"SettlementBatch:{res.get('batch_code')}",
        details=res,
        request=request,
    )
    return res


@router.post("/settlement/release-selected")
async def release_selected_commissions(
    payload: ReleaseSelectedCommissionsRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Release pending referral commissions for selected users in a single batch."""
    res = await WeeklySettlementService.release_selected_commissions(
        db=db,
        user_ids=payload.user_ids,
        executed_by_admin_id=current_admin.id,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="RELEASE_SELECTED_COMMISSIONS",
        target_entity=f"SettlementBatch:{res.get('batch_code')}",
        details={"user_ids": payload.user_ids, **res},
        request=request,
    )
    return res


@router.post("/settlement/release-user/{user_id}")
async def release_user_pending_commission(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Release pending referral commissions for a specific user immediately into withdrawable balance."""
    res = await WeeklySettlementService.release_user_pending_commission(
        db=db,
        user_id=user_id,
        executed_by_admin_id=current_admin.id,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="RELEASE_USER_COMMISSION",
        target_entity=f"User:{user_id}",
        details=res,
        request=request,
    )
    return res


@router.get("/settlement/history")
async def get_settlement_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Get paginated history of executed weekly settlements."""
    return await WeeklySettlementService.get_settlement_history(db, page, page_size)


@router.get("/settlement/batches/{batch_code}")
async def get_settlement_batch_details(
    batch_code: str,
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Get details and enriched ledgers of a specific settlement batch."""
    details = await WeeklySettlementService.get_batch_details(db, batch_code)
    ledgers = details["ledgers"]
    uid_set = {l.user_id for l in ledgers if l.user_id is not None}
    users_map: dict[int, User] = {}
    if uid_set:
        users_map = {
            u.id: u
            for u in (await db.execute(select(User).where(User.id.in_(list(uid_set))))).scalars().all()
        }
    return {
        "batch": details["batch"],
        "ledgers": [
            {
                "id": l.id,
                "order_payment_id": l.order_payment_id,
                "beneficiary_type": l.beneficiary_type,
                "user_id": l.user_id,
                "username": users_map[l.user_id].username if l.user_id in users_map else None,
                "full_name": users_map[l.user_id].full_name if l.user_id in users_map else None,
                "tier_level": l.tier_level,
                "amount_toman": l.amount_toman,
                "description": l.description,
                "settlement_status": l.settlement_status,
                "settled_at": l.settled_at,
                "settlement_batch_id": l.settlement_batch_id,
                "created_at": l.created_at,
            }
            for l in ledgers
        ],
    }


# --- Step 20 & 28: Admin Tree Pedigree Explorer, Waterfall Tracer & Hidden Flag ---

class UpdateHiddenStatusRequest(BaseModel):
    is_referral_hidden: bool


@router.get("/tree/roots")
async def get_referral_network_roots(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """List top root referrers in the network for immediate tree navigation."""
    return await WeeklySettlementService.get_network_roots(db, page=page, limit=limit)


@router.get("/tree/{user_id}")
async def get_user_pedigree_tree(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Explore a user's upline pedigree, enriched downlines, wallet, and inspector details."""
    return await WeeklySettlementService.get_admin_user_tree(db, user_id)


@router.get("/tree/{user_id}/children")
async def get_user_tree_children(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Lazy-load paginated direct children of a tree node for multi-depth expansion."""
    return await WeeklySettlementService.get_admin_tree_children(db, user_id, page=page, limit=limit)


@router.get("/tree/{user_id}/simulate-waterfall")
async def simulate_user_waterfall(
    user_id: int,
    amount_toman: int = Query(1_000_000, ge=1000, le=500_000_000),
    require_active_subscription: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Dry-run simulation of how a hypothetical purchase by user_id splits commissions."""
    return await WeeklySettlementService.simulate_order_waterfall(
        db=db,
        buyer_id=user_id,
        amount_toman=amount_toman,
        require_active_subscription=require_active_subscription,
    )


@router.get("/commissions/recent-orders")
async def list_recent_commission_orders(
    user_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """List recent subscription orders for commission waterfall selection."""
    return await WeeklySettlementService.get_recent_commission_orders(db, user_id=user_id, limit=limit)


@router.get("/orders/{order_payment_id}/trace")
async def trace_order_commission_waterfall(
    order_payment_id: int,
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Inspect real recorded CommissionLedger waterfall and upline structure for a specific order."""
    return await WeeklySettlementService.trace_order_waterfall(db, order_payment_id)


@router.put("/users/{user_id}/hidden-status")
async def toggle_user_hidden_status(
    user_id: int,
    payload: UpdateHiddenStatusRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Toggle is_referral_hidden flag for a user to bypass or include them in referral waterfall."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="کاربر مورد نظر یافت نشد.")

    old_status = user.is_referral_hidden
    user.is_referral_hidden = payload.is_referral_hidden
    await db.commit()

    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UPDATE_REFERRAL_HIDDEN_STATUS",
        target_entity=f"User:{user_id}",
        details={"old_status": old_status, "new_status": user.is_referral_hidden},
        request=request,
    )
    return {"status": "success", "user_id": user_id, "is_referral_hidden": user.is_referral_hidden}


# --- Step 27: Referral Blacklist, Ghosting & Subscription Ban ---

class BlacklistUserRequest(BaseModel):
    block_referral: bool = True
    block_subscription: bool = False
    reason: str = ""


@router.post("/users/{user_id}/blacklist")
async def blacklist_referral_user(
    user_id: int,
    payload: BlacklistUserRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Block/ghost user in referral chains and optionally revoke/ban active subscriptions."""
    res = await WalletService.block_user_in_referral(
        db=db,
        admin_id=current_admin.id,
        user_id=user_id,
        block_referral=payload.block_referral,
        block_subscription=payload.block_subscription,
        reason=payload.reason,
        redis=redis,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="BLACKLIST_REFERRAL_USER",
        target_entity=f"User:{user_id}",
        details={
            "block_referral": payload.block_referral,
            "block_subscription": payload.block_subscription,
            "reason": payload.reason,
        },
        request=request,
    )
    return res


@router.delete("/users/{user_id}/blacklist")
async def unblock_referral_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Remove user from active blacklist and lift referral/subscription restrictions."""
    res = await WalletService.unblock_user_in_referral(
        db=db,
        admin_id=current_admin.id,
        user_id=user_id,
        redis=redis,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="UNBLOCK_REFERRAL_USER",
        target_entity=f"User:{user_id}",
        details=res,
        request=request,
    )
    return res


@router.get("/blacklist")
async def list_referral_blacklist(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = Query(True),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """List blacklisted users with their status flags and block reasons."""
    return await WalletService.list_referral_blacklist(
        db=db,
        page=page,
        limit=limit,
        active_only=active_only,
        search=search,
    )


# --- Step 20 & 28: Treasury Pool Dashboard & Grant ---

class TreasuryRewardRequest(BaseModel):
    user_id: int
    amount_toman: int
    description: str = ""


@router.get("/treasury")
async def get_treasury_status(
    action_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: ReferralAdmin = Depends(require_referral_admin()),
):
    """Get platform treasury pool balance, totals, and audit logs."""
    from app.modules.wallet.treasury_models import TreasuryLog
    pool = await WalletService.get_or_create_treasury_pool(db)
    logs_stmt = select(TreasuryLog)
    if action_type and action_type.strip().lower() not in ("", "all"):
        logs_stmt = logs_stmt.where(TreasuryLog.action_type == action_type.strip())
    logs_stmt = logs_stmt.order_by(TreasuryLog.created_at.desc()).limit(50)
    logs = (await db.execute(logs_stmt)).scalars().all()
    return {
        "pool": pool,
        "recent_logs": logs,
    }


@router.post("/treasury/grant-reward")
async def grant_treasury_reward(
    payload: TreasuryRewardRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: ReferralAdmin = Depends(require_referral_admin(level=AdminAccessLevel.FULL_CRUD)),
):
    """Grant an admin reward to a user directly from the treasury pool."""
    res = await WalletService.admin_grant_treasury_reward(
        db=db,
        user_id=payload.user_id,
        amount_toman=payload.amount_toman,
        description=payload.description,
    )
    await log_admin_action(
        db=db,
        department="referral",
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        action="GRANT_TREASURY_REWARD",
        target_entity=f"User:{payload.user_id}",
        details={"amount_toman": payload.amount_toman, "description": payload.description},
        request=request,
    )
    return res

