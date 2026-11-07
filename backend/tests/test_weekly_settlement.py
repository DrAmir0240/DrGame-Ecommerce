"""Unit tests for weekly referral settlement engine and batch idempotency."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.wallet.models import UserWallet, ReferralChain, CommissionLedger, SettlementBatch
from app.modules.wallet.services import WalletService
from app.modules.wallet.settlement_service import WeeklySettlementService


@pytest.mark.asyncio
async def test_weekly_settlement_lifecycle_and_idempotency(test_db: AsyncSession):
    # 1. Setup users: Referrer and Buyer
    referrer = User(full_name="Master Referrer", username="ref_master", referral_code="REFMASTER", console_auth_code="RM01", password_hash="h")
    buyer = User(full_name="Loyal Gamer", username="buyer_loyal", referral_code="BUYERLOYAL", console_auth_code="BL02", password_hash="h")
    test_db.add_all([referrer, buyer])
    await test_db.commit()
    await test_db.refresh(referrer)
    await test_db.refresh(buyer)

    # 2. Bind referral
    await WalletService.bind_referral(test_db, buyer.id, "REFMASTER")

    # 3. Simulate purchase: 2,000,000 Toman, 20% budget = 400,000 Toman
    # Level 1 gets 50% = 200,000 Toman
    res = await WalletService.distribute_referral_commission(
        db=test_db,
        buyer_id=buyer.id,
        order_amount_toman=2000000,
        base_commission_percent=20.0,
    )
    assert res["status"] == "success"
    assert res["distributed_sum"] == 200000

    # 4. Verify wallet state: withdrawable is 0, pending is 200,000
    w = await WalletService.get_or_create_wallet(test_db, referrer.id)
    assert w.withdrawable_balance_toman == 0
    assert w.pending_balance_toman == 200000

    # 5. Preview settlement (Dry-Run)
    preview = await WeeklySettlementService.preview_weekly_settlement(test_db)
    assert preview["total_pending_amount_toman"] == 200000
    assert preview["total_beneficiaries"] == 1
    assert preview["beneficiaries"][0]["user_id"] == referrer.id
    assert preview["beneficiaries"][0]["pending_amount_toman"] == 200000

    # 6. Execute weekly settlement
    settle_res = await WeeklySettlementService.execute_weekly_settlement(
        test_db, executed_by_admin_id=1, executed_by_type="admin"
    )
    assert settle_res["status"] == "success"
    assert settle_res["settled_amount_toman"] == 200000
    assert settle_res["beneficiaries_count"] == 1
    batch_code = settle_res["batch_code"]
    assert batch_code is not None

    # 7. Verify wallet state after settlement: withdrawable is 200,000, pending is 0
    await test_db.refresh(w)
    assert w.withdrawable_balance_toman == 200000
    assert w.pending_balance_toman == 0
    assert w.total_earned_toman == 200000

    # 8. Check ledger record
    ledger_stmt = select(CommissionLedger).where(CommissionLedger.user_id == referrer.id)
    ledger = (await test_db.execute(ledger_stmt)).scalar_one()
    assert ledger.settlement_status == "settled"
    assert ledger.settlement_batch_id == batch_code
    assert ledger.settled_at is not None

    # 9. Test idempotency: executing settlement again when no pending ledgers remain returns empty
    second_settle = await WeeklySettlementService.execute_weekly_settlement(test_db)
    assert second_settle["status"] == "empty"
    assert second_settle["settled_amount_toman"] == 0

    # 10. Check batch history and details
    hist = await WeeklySettlementService.get_settlement_history(test_db)
    assert hist["total"] >= 1
    assert any(b.batch_code == batch_code for b in hist["items"])

    details = await WeeklySettlementService.get_batch_details(test_db, batch_code)
    assert details["batch"].batch_code == batch_code
    assert len(details["ledgers"]) == 1


@pytest.mark.asyncio
async def test_user_network_tree_dynamic_layers(test_db: AsyncSession):
    """Verify that network tree returns empty levels for 0 referrals, and dynamically increments as levels are added."""
    # 1. New user with no referrals
    solo_user = User(full_name="Solo User", username="solo_user", referral_code="SOLO001", console_auth_code="SL01", password_hash="h")
    test_db.add(solo_user)
    await test_db.commit()
    await test_db.refresh(solo_user)

    tree = await WeeklySettlementService.get_user_network_tree(test_db, solo_user.id)
    assert tree["total_members"] == 0
    assert tree["levels"] == []  # No active levels for new account

    # 2. Add Layer 1 referral
    l1_user = User(full_name="L1 User", username="l1_user", referral_code="L1REF01", console_auth_code="L101", password_hash="h")
    test_db.add(l1_user)
    await test_db.commit()
    await test_db.refresh(l1_user)

    await WalletService.bind_referral(test_db, l1_user.id, "SOLO001")

    tree_l1 = await WeeklySettlementService.get_user_network_tree(test_db, solo_user.id)
    assert tree_l1["total_members"] == 1
    assert len(tree_l1["levels"]) == 1
    assert tree_l1["levels"][0]["level"] == 1
    assert tree_l1["levels"][0]["members_count"] == 1

    # 3. Add Layer 2 referral (L1 invites L2)
    l2_user = User(full_name="L2 User", username="l2_user", referral_code="L2REF02", console_auth_code="L202", password_hash="h")
    test_db.add(l2_user)
    await test_db.commit()
    await test_db.refresh(l2_user)

    await WalletService.bind_referral(test_db, l2_user.id, "L1REF01")

    tree_l2 = await WeeklySettlementService.get_user_network_tree(test_db, solo_user.id)
    assert tree_l2["total_members"] == 2
    assert len(tree_l2["levels"]) == 2
    assert tree_l2["levels"][0]["level"] == 1
    assert tree_l2["levels"][1]["level"] == 2
    assert tree_l2["levels"][1]["members_count"] == 1

