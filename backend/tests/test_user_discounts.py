"""Unit tests for user-bound promotional discounts and bulk assignment."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.subscriptions.discount_service import UserDiscountService
from app.modules.subscriptions.services import SubscriptionService
from app.modules.subscriptions.models import UserDiscount


@pytest.mark.asyncio
async def test_bulk_user_discounts_and_checkout(test_db: AsyncSession, fake_redis):
    # 1. Create two test users
    u1 = User(full_name="User Alpha", username="user_alpha", referral_code="ALPHA01", console_auth_code="CA01", password_hash="h")
    u2 = User(full_name="User Beta", username="user_beta", referral_code="BETA02", console_auth_code="CB02", password_hash="h")
    test_db.add_all([u1, u2])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)

    # 2. Bulk assign 20% discount for 7 days
    discounts = await UserDiscountService.create_bulk_user_discounts(
        db=test_db,
        user_ids=[u1.id, u2.id],
        discount_percent=20,
        duration_days=7,
        title="تخفیف ویژه آغاز سال",
        applicable_tier_codes=["bronze", "silver", "gold"],
    )
    assert len(discounts) == 2

    # 3. Check active discount for user 1
    active_d1 = await UserDiscountService.get_active_user_discount(test_db, u1.id, tier_code="silver")
    assert active_d1 is not None
    assert active_d1.discount_percent == 20
    assert active_d1.is_used is False

    # 4. Check tiers display for user 1 (strikethrough pricing)
    tiers = await SubscriptionService.get_all_tiers(test_db, user_id=u1.id)
    silver = next(t for t in tiers if t.code == "silver")
    assert silver.user_discount is not None
    assert silver.user_discount["discount_percent"] == 20
    durs = getattr(silver, "durations")
    one_m = durs["1_month"]
    assert one_m["discounted_price_toman"] == int(one_m["price_toman"] * 0.8)

    # 5. Process checkout for user 1: should automatically apply user discount
    checkout_res = await SubscriptionService.process_checkout(
        db=test_db,
        redis=fake_redis,
        user_id=u1.id,
        tier_code="silver",
        duration_months=1,
    )
    assert checkout_res["status"] == "success"

    # 6. Verify discount was marked as used
    await test_db.refresh(active_d1)
    assert active_d1.is_used is True
    assert active_d1.order_payment_id is not None

    # 7. Next checkout for user 1 has no discount left
    no_disc = await UserDiscountService.get_active_user_discount(test_db, u1.id)
    assert no_disc is None
