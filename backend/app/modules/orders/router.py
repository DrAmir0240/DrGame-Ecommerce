from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, get_current_active_user
from app.modules.orders.schemas import CheckoutIn, CheckoutOut, OrderOut, ValidateCouponIn, ValidateCouponOut
from app.modules.orders.services import OrderService
from app.modules.users.models import User

router = APIRouter(prefix="/orders", tags=["Orders & Checkout"])


@router.post("/validate-coupon", response_model=ValidateCouponOut)
async def validate_coupon(
    body: ValidateCouponIn,
    db: AsyncSession = Depends(get_db),
):
    return await OrderService.validate_coupon(db, body.code)


@router.post("/checkout", response_model=CheckoutOut)
async def process_checkout(
    body: CheckoutIn,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await OrderService.process_checkout(
        db=db,
        user=user,
        plan_id=body.plan_id,
        gateway=body.gateway,
        coupon_code=body.coupon_code,
    )


@router.get("/my-orders", response_model=List[OrderOut])
async def get_my_orders(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    user_id = user.id if user else 1
    orders = await OrderService.get_user_orders(db, user_id)
    return [
        OrderOut(
            id=o.id,
            plan_id=o.plan_id,
            plan_name=o.plan_name,
            tracking_code=o.tracking_code,
            final_price=int(o.final_price),
            gateway=o.gateway,
            status=o.status,
            quota_credited_gb=o.quota_credited_gb,
            created_at=o.created_at,
        )
        for o in orders
    ]
