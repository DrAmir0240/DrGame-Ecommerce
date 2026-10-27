"""Subscriptions router: tiers, my-status, discount validation, and checkout."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.subscriptions.models import SubscriptionTier
from app.modules.subscriptions.schemas import (
    SubscriptionTierOut,
    DiscountValidateRequest,
    DiscountValidateResponse,
    CheckoutRequest,
    CheckoutResponse,
    MySubscriptionStatus,
)
from app.modules.subscriptions.services import SubscriptionService
from app.modules.quota.services import QuotaService

router = APIRouter(tags=["Subscriptions"])

@router.get("/tiers", response_model=List[SubscriptionTierOut], status_code=status.HTTP_200_OK)
async def list_subscription_tiers(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve 4 official subscription tiers (Free, Bronze, Silver, Gold)."""
    return await SubscriptionService.get_all_tiers(db)

@router.get("/my-status", response_model=MySubscriptionStatus, status_code=status.HTTP_200_OK)
async def get_my_subscription_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Get authenticated user's current subscription tier, expiration date, and quota status."""
    active_sub = await SubscriptionService.get_user_active_subscription(db, current_user.id)
    quota = await QuotaService.get_user_quota(db, redis, current_user.id)

    tier_out = None
    end_date_str = None

    if active_sub:
        tier_record = await db.scalar(
            select(SubscriptionTier).where(SubscriptionTier.code == active_sub.tier_code)
        )
        if tier_record:
            tier_out = SubscriptionTierOut.model_validate(tier_record)
        end_date_str = active_sub.end_date.isoformat()

    return MySubscriptionStatus(
        has_active_subscription=bool(active_sub),
        tier=tier_out,
        end_date=end_date_str,
        quota=quota
    )

@router.post("/discount/validate", response_model=DiscountValidateResponse, status_code=status.HTTP_200_OK)
async def validate_discount(
    payload: DiscountValidateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Validate discount coupon and calculate discount amount."""
    res = await SubscriptionService.validate_discount_code(db, payload.code, payload.original_price)
    return DiscountValidateResponse(**res)

@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_200_OK)
async def process_checkout(
    payload: CheckoutRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Process simulated checkout (1, 3, or 6 months), issue subscription, and charge quota."""
    res = await SubscriptionService.process_checkout(
        db=db,
        redis=redis,
        user_id=current_user.id,
        tier_code=payload.tier_code,
        duration_months=payload.duration_months,
        discount_code=payload.discount_code,
        payment_method=payload.payment_method,
    )
    return CheckoutResponse(**res)


@router.get("/free-tier-games", status_code=status.HTTP_200_OK)
async def get_free_tier_games(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve allowed game IDs for free tier subscription."""
    return await SubscriptionService.get_free_tier_games(db)

