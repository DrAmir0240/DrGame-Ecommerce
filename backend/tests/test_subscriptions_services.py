"""Unit tests for SubscriptionService: tier seeding, discounts, and checkout."""
from datetime import datetime, timedelta, timezone
import pytest
from app.modules.subscriptions.models import DiscountCode
from app.modules.subscriptions.services import SubscriptionService
from app.core.exceptions import BadRequestError, NotFoundError

@pytest.mark.asyncio
async def test_subscription_tiers_seeding(test_db):
    tiers = await SubscriptionService.get_all_tiers(test_db)
    assert len(tiers) == 4
    tier_codes = [t.code for t in tiers]
    assert "free" in tier_codes
    assert "bronze" in tier_codes
    assert "silver" in tier_codes
    assert "gold" in tier_codes

@pytest.mark.asyncio
async def test_discount_code_validation(test_db):
    # Setup percent discount
    now = datetime.now(timezone.utc)
    disc = DiscountCode(
        code="GAMER20",
        discount_percent=20,
        max_discount_toman=500000,
        usage_limit=10,
        used_count=0,
        expires_at=now + timedelta(days=5),
        is_active=True
    )
    test_db.add(disc)
    await test_db.commit()

    # Valid discount calculation
    res = await SubscriptionService.validate_discount_code(test_db, "GAMER20", 1500000)
    assert res["valid"] is True
    assert res["discount_amount"] == 300000  # 20% of 1,500,000
    assert res["final_price"] == 1200000

    # Non-existent discount
    with pytest.raises(BadRequestError):
        await SubscriptionService.validate_discount_code(test_db, "INVALIDCODE", 1000000)

@pytest.mark.asyncio
async def test_process_checkout_flow(test_db, fake_redis):
    # Process checkout for Silver Tier (1000 GB)
    res = await SubscriptionService.process_checkout(
        db=test_db,
        redis=fake_redis,
        user_id=123,
        tier_code="silver",
        payment_method="simulation"
    )
    assert res["status"] == "success"
    assert res["tier_code"] == "silver"
    assert res["quota"]["total_quota_gb"] >= 1000.0
    assert res["quota"]["remaining_quota_gb"] >= 1000.0
