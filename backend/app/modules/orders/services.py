from datetime import datetime, timedelta
from decimal import Decimal
import logging
import random
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AppException
from app.modules.orders.models import DiscountCode, Order
from app.modules.orders.schemas import CheckoutOut, ValidateCouponOut
from app.modules.subscriptions.models import SubscriptionTier, UserSubscription
from app.modules.users.models import User, UserProfile

logger = logging.getLogger("drgame.orders")

PLANS_INFO = {
    "bronze": {"name": "پلن برنزی گیمر", "price": 498000, "quota_gb": 350, "duration": 30},
    "silver": {"name": "پلن نقره‌ای ویژه", "price": 1198000, "quota_gb": 1024, "duration": 30},
    "gold": {"name": "پلن طلایی VIP نامحدود", "price": 2988000, "quota_gb": 2252, "duration": 30},
}


class OrderService:
    @staticmethod
    async def validate_coupon(db: AsyncSession, code: str) -> ValidateCouponOut:
        await OrderService.seed_coupons_if_empty(db)
        clean_code = code.strip().upper()

        res = await db.execute(select(DiscountCode).where(DiscountCode.code == clean_code))
        discount = res.scalar_one_or_none()

        if not discount or not discount.is_active:
            raise AppException(status_code=400, code="INVALID_COUPON", message="کد تخفیف وارد شده معتبر نمی‌باشد.")

        if discount.expires_at and discount.expires_at < datetime.utcnow():
            raise AppException(status_code=400, code="EXPIRED_COUPON", message="مهلت استفاده از این کد تخفیف به پایان رسیده است.")

        if discount.current_uses >= discount.max_uses:
            raise AppException(status_code=400, code="COUPON_LIMIT_REACHED", message="سقف استفاده از این کد تخفیف تکمیل شده است.")

        return ValidateCouponOut(
            valid=True,
            code=discount.code,
            discount_percent=discount.discount_percent,
            message=f"کد تخفیف {discount.discount_percent}٪ با موفقیت اعمال گردید.",
        )

    @staticmethod
    async def process_checkout(
        db: AsyncSession,
        user: Optional[User],
        plan_id: str,
        gateway: str,
        coupon_code: Optional[str] = None,
    ) -> CheckoutOut:
        plan_meta = PLANS_INFO.get(plan_id.lower(), PLANS_INFO["silver"])
        base_price = plan_meta["price"]
        quota_gb = plan_meta["quota_gb"]

        discount_percent = 0
        discount_amount = 0

        # Validate coupon if provided
        if coupon_code and coupon_code.strip():
            c_res = await db.execute(
                select(DiscountCode).where(DiscountCode.code == coupon_code.strip().upper())
            )
            discount = c_res.scalar_one_or_none()
            if discount and discount.is_active:
                discount_percent = discount.discount_percent
                discount_amount = int((base_price * discount_percent) / 100)
                discount.current_uses += 1

        final_price = max(0, base_price - discount_amount)
        tracking_code = f"TRK-{random.randint(10000000, 99999999)}"

        user_id = user.id if user else 1

        # Create Order in DB
        order = Order(
            user_id=user_id,
            plan_id=plan_id,
            plan_name=plan_meta["name"],
            tracking_code=tracking_code,
            amount=Decimal(base_price),
            discount_amount=Decimal(discount_amount),
            final_price=Decimal(final_price),
            coupon_code=coupon_code.strip().upper() if coupon_code else None,
            gateway=gateway,
            status="PAID",
            quota_credited_gb=quota_gb,
        )
        db.add(order)

        # Update User Subscription
        now = datetime.utcnow()
        expires = now + timedelta(days=plan_meta["duration"])
        sub_res = await db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
        user_sub = sub_res.scalar_one_or_none()
        quota_bytes = quota_gb * 1024 * 1024 * 1024

        if user_sub:
            user_sub.tier_id = 2 if plan_id == "silver" else (3 if plan_id == "gold" else 1)
            user_sub.expires_at = expires
            user_sub.total_quota_bytes += quota_bytes
            user_sub.is_active = True
        else:
            new_sub = UserSubscription(
                user_id=user_id,
                tier_id=2 if plan_id == "silver" else (3 if plan_id == "gold" else 1),
                starts_at=now,
                expires_at=expires,
                total_quota_bytes=quota_bytes,
                used_quota_bytes=0,
                is_active=True,
            )
            db.add(new_sub)

        await db.commit()

        return CheckoutOut(
            success=True,
            tracking_code=tracking_code,
            plan_name=plan_meta["name"],
            original_price=base_price,
            discount_amount=discount_amount,
            final_price=final_price,
            quota_added_gb=quota_gb,
            message="اشتراک شما با موفقیت فعال شد و سهمیه دانلود به حساب کاربری افزوده گردید.",
        )

    @staticmethod
    async def get_user_orders(db: AsyncSession, user_id: int) -> List[Order]:
        res = await db.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        )
        return list(res.scalars().all())

    @staticmethod
    async def seed_coupons_if_empty(db: AsyncSession) -> None:
        count = await db.execute(select(func.count(DiscountCode.id)))
        if (count.scalar() or 0) > 0:
            return

        defaults = [
            DiscountCode(code="DRGAME10", discount_percent=10, max_uses=1000),
            DiscountCode(code="GOLD35", discount_percent=35, max_uses=500),
            DiscountCode(code="WELCOME5", discount_percent=5, max_uses=2000),
            DiscountCode(code="VIP2026", discount_percent=20, max_uses=300),
        ]
        for c in defaults:
            db.add(c)
        await db.commit()
