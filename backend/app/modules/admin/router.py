"""Admin router: isolated authentication, user management, manual quota adjustment,
financial monitoring, referral payouts, games catalog, and discounts."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.admin_dependencies import get_current_admin
from app.modules.auth.admin_models import AdminUser
from app.modules.admin.services import AdminService
from app.modules.admin.schemas import (
    AdminLoginRequest,
    AdminTokenResponse,
    AdminInfoResponse,
    DashboardStatsResponse,
    UserListResponse,
    UserDossierResponse,
    AdjustQuotaRequest,
    AdjustQuotaResponse,
    FinanceOverviewResponse,
    PayoutRequestItem,
    ProcessPayoutRequest,
    VerifyAccountRequest,
    GameCreateRequest,
    GameUpdateRequest,
    SetFreeTierGamesRequest,
    DiscountCreateRequest,
)

router = APIRouter(tags=["Admin Panel"])


# --- Admin Authentication ---

@router.post("/auth/login", response_model=AdminTokenResponse, status_code=status.HTTP_200_OK)
async def admin_login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate administrator and return isolated admin JWT."""
    result = await AdminService.login(db, payload.username_or_email, payload.password)
    return AdminTokenResponse(**result)


@router.get("/auth/me", response_model=AdminInfoResponse, status_code=status.HTTP_200_OK)
async def get_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    """Get authenticated admin profile."""
    return AdminInfoResponse(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        role=current_admin.role,
    )


# --- Dashboard Stats ---

@router.get("/stats", response_model=DashboardStatsResponse, status_code=status.HTTP_200_OK)
async def get_admin_dashboard_stats(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve top-level platform statistics and KPIs."""
    return await AdminService.get_dashboard_stats(db)


# --- User Management & Quotas ---

@router.get("/users", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def list_users(
    search: str | None = Query(None, description="Search term for name, username, phone, or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List registered users with current quota allocations."""
    return await AdminService.list_users(db, search=search, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserDossierResponse, status_code=status.HTTP_200_OK)
async def get_user_dossier(
    user_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive user dossier (profile, quotas, wallet, order payments)."""
    return await AdminService.get_user_dossier(db, user_id=user_id)


@router.post("/users/{user_id}/adjust-quota", response_model=AdjustQuotaResponse, status_code=status.HTTP_200_OK)
async def adjust_user_quota(
    user_id: int,
    payload: AdjustQuotaRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Manually add or subtract quota (GB) for a specific user and bust cache."""
    return await AdminService.adjust_user_quota(
        db=db,
        redis=redis,
        user_id=user_id,
        added_gb=payload.added_gb,
        reason=payload.reason or "شارژ دستی توسط مدیریت کلان",
    )


# --- Financial Monitoring ---

@router.get("/finance/overview", response_model=FinanceOverviewResponse, status_code=status.HTTP_200_OK)
async def get_finance_overview(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Read-only financial overview separated into domestic Toman and crypto transactions."""
    return await AdminService.get_finance_overview(db)


# --- Referral Payouts & Settlement Accounts ---

@router.get("/payouts", response_model=list[PayoutRequestItem], status_code=status.HTTP_200_OK)
async def list_payouts(
    status: str | None = Query(None, description="Filter by status: pending, approved, rejected"),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List referral commission withdrawal requests."""
    return await AdminService.list_payout_requests(db, status=status)


@router.post("/payouts/{request_id}/process", status_code=status.HTTP_200_OK)
async def process_payout(
    request_id: int,
    payload: ProcessPayoutRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a withdrawal request. If rejected, funds are refunded to wallet."""
    return await AdminService.process_payout_request(
        db,
        request_id=request_id,
        new_status=payload.new_status,
        admin_receipt_url=payload.admin_receipt_url,
        admin_notes=payload.admin_notes,
    )


@router.post("/bank-accounts/{account_id}/verify", status_code=status.HTTP_200_OK)
async def verify_settlement_account(
    account_id: int,
    payload: VerifyAccountRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject user settlement bank/crypto account."""
    return await AdminService.verify_settlement_account(db, account_id=account_id, is_verified=payload.is_verified)


# --- Game Catalog Management ---

from fastapi import UploadFile, File, Body
from app.core.storage import save_uploaded_file, download_and_save_image

@router.post("/games/upload-image", status_code=status.HTTP_200_OK)
async def upload_game_image(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Upload an image file directly to DrGame local media storage."""
    url = await save_uploaded_file(file, prefix="game")
    return {"url": url}

@router.post("/games/cache-image", status_code=status.HTTP_200_OK)
async def cache_remote_game_image(
    payload: dict = Body(...),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Download a remote image (e.g. from RAWG) and store it in DrGame local storage."""
    remote_url = payload.get("image_url")
    if not remote_url:
        return {"error": "image_url is required"}
    url = await download_and_save_image(remote_url, prefix="cached")
    return {"url": url}

@router.get("/games", status_code=status.HTTP_200_OK)
async def list_games(
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List games in catalog with pagination."""
    return await AdminService.list_games(db, search=search, page=page, page_size=page_size)


@router.post("/games", status_code=status.HTTP_201_CREATED)
async def create_game(
    payload: GameCreateRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new game in catalog."""
    game = await AdminService.create_game(db, payload.model_dump())
    return {"id": game.id, "title_fa": game.title_fa, "title_en": game.title_en}


@router.get("/games/{game_id}", status_code=status.HTTP_200_OK)
async def get_game(
    game_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full game details for admin editing."""
    game = await AdminService.get_game(db, game_id)
    return game


@router.put("/games/{game_id}", status_code=status.HTTP_200_OK)
async def update_game(
    game_id: int,
    payload: GameUpdateRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update existing game in catalog."""
    game = await AdminService.update_game(db, game_id, payload.model_dump(exclude_unset=True))
    return {"id": game.id, "title_fa": game.title_fa, "title_en": game.title_en}


@router.delete("/games/{game_id}", status_code=status.HTTP_200_OK)
async def delete_game(
    game_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a game from catalog."""
    return await AdminService.delete_game(db, game_id)


# --- Free Tier Games & Subscriptions ---

@router.get("/free-tier-games", status_code=status.HTTP_200_OK)
async def get_free_tier_games(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List allowed free-tier games."""
    return await AdminService.list_free_tier_games(db)


@router.post("/free-tier-games", status_code=status.HTTP_200_OK)
async def set_free_tier_games(
    payload: SetFreeTierGamesRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Set up to 5 allowed free-tier games."""
    ids = await AdminService.set_free_tier_games(db, payload.game_ids)
    return {"allowed_game_ids": ids}


@router.get("/subscriptions", status_code=status.HTTP_200_OK)
async def list_subscriptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List user subscriptions."""
    return await AdminService.list_subscriptions(db, page=page, page_size=page_size)


# --- Discount Codes ---

@router.get("/discounts", status_code=status.HTTP_200_OK)
async def list_discounts(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List discount coupons."""
    return await AdminService.list_discount_codes(db)


@router.post("/discounts", status_code=status.HTTP_201_CREATED)
async def create_discount(
    payload: DiscountCreateRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new discount code."""
    discount = await AdminService.create_discount_code(db, payload.model_dump())
    return {"id": discount.id, "code": discount.code, "is_active": discount.is_active}


@router.delete("/discounts/{discount_id}", status_code=status.HTTP_200_OK)
async def delete_discount(
    discount_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a discount code."""
    return await AdminService.delete_discount_code(db, discount_id)


# --- Referral Tree & Treasury Pool Management ---

@router.post("/users/{user_id}/toggle-referral-hide", status_code=status.HTTP_200_OK)
async def toggle_user_referral_hide(
    user_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle pass-through bypass (is_referral_hidden) on user in referral network."""
    return await AdminService.toggle_user_referral_hide(db, user_id=user_id)


@router.get("/referrals/overview", status_code=status.HTTP_200_OK)
async def get_referrals_overview(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve comprehensive referral network metrics, layer counts, and user list."""
    return await AdminService.get_referral_overview(db)


@router.get("/treasury", status_code=status.HTTP_200_OK)
async def get_treasury_summary(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """View current balance and audit logs of platform referral treasury pool."""
    return await AdminService.get_treasury_summary(db)


@router.post("/treasury/reset", status_code=status.HTTP_200_OK)
async def reset_treasury(
    payload: dict = Body(default={}),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reset platform referral treasury pool balance to zero."""
    description = payload.get("description", "صفر کردن موجودی صندوق توسط ادمین")
    return await AdminService.reset_treasury(db, description=description)


@router.post("/treasury/reward", status_code=status.HTTP_200_OK)
async def grant_treasury_reward(
    payload: dict = Body(...),
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Grant reward from platform treasury pool directly to a user's wallet."""
    user_id = payload.get("user_id")
    amount_toman = payload.get("amount_toman")
    description = payload.get("description", "پاداش ویژه از صندوق پلتفرم")
    return await AdminService.grant_treasury_reward(
        db, user_id=user_id, amount_toman=amount_toman, description=description
    )

