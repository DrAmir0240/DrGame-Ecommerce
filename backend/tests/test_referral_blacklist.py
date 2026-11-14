"""Tests for Step 27: referral ghosting/blacklist, bank account ban, subscription ban, and dual-mode settlement."""
from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_dependencies import create_department_admin_token
from app.core.exceptions import BadRequestException, ForbiddenException
from app.core.security import hash_password
from app.modules.admin.models import AdminAccessLevel, AdminAuditLog, ReferralAdmin
from app.modules.subscriptions.models import SubscriptionTier, UserSubscription
from app.modules.subscriptions.services import SubscriptionService
from app.modules.users.models import User
from app.modules.wallet.models import CommissionLedger, ReferralBlacklist, SettlementAccount, UserWallet
from app.modules.wallet.services import WalletService
from app.modules.wallet.settlement_service import WeeklySettlementService
from app.modules.wallet.treasury_models import TreasuryLog


@pytest.mark.asyncio
async def test_ghosted_user_diverts_commission_to_treasury_without_shifting_upline(test_db: AsyncSession):
    """Blocked/ghosted user gets 0, their tier share goes to treasury, and Layer 2 keeps halved share."""
    u1 = User(full_name="Top Referrer", username="top_ref", referral_code="TOP001", console_auth_code="TP01", password_hash="h")
    u2 = User(full_name="Ghosted Mid", username="ghost_mid", referral_code="GHS002", console_auth_code="GH02", password_hash="h")
    buyer = User(full_name="Buyer Gamer", username="buyer_g", referral_code="BUY003", console_auth_code="BY03", password_hash="h")
    admin = ReferralAdmin(
        username="ref_admin_t1",
        email="ref1@drgame.local",
        password_hash=hash_password("pass12345"),
        full_name="Ref Admin",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    test_db.add_all([u1, u2, buyer, admin])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)
    await test_db.refresh(buyer)
    await test_db.refresh(admin)

    await WalletService.bind_referral(test_db, u2.id, "TOP001")
    await WalletService.bind_referral(test_db, buyer.id, "GHS002")

    # Block/Ghost u2 in referral chain (checkbox 1 only)
    block_res = await WalletService.block_user_in_referral(
        db=test_db,
        admin_id=admin.id,
        user_id=u2.id,
        block_referral=True,
        block_subscription=False,
        reason="Fake invites",
    )
    assert block_res["status"] == "success"
    assert block_res["block_referral"] is True
    await test_db.refresh(u2)
    assert u2.is_referral_blocked is True

    # Buyer purchases 1,000,000 Toman at 20% commission pool = 200,000
    # Layer 1 (u2, GHOSTED): 100,000 -> ReferralTreasuryPool (not u2 wallet)
    # Layer 2 (u1, active): 50,000 -> u1 pending_balance_toman
    # Leftover: 50,000 -> ReferralTreasuryPool (total treasury = 150,000)
    dist = await WalletService.distribute_referral_commission(
        db=test_db,
        buyer_id=buyer.id,
        order_amount_toman=1_000_000,
        order_payment_id=701,
        base_commission_percent=20.0,
    )
    assert dist["status"] == "success"
    assert dist["distributed_sum"] == 150_000
    assert dist["leftover_amount"] == 50_000

    w_ghost = await WalletService.get_or_create_wallet(test_db, u2.id)
    w_top = await WalletService.get_or_create_wallet(test_db, u1.id)
    assert w_ghost.pending_balance_toman == 0
    assert w_ghost.withdrawable_balance_toman == 0
    assert w_top.pending_balance_toman == 50_000

    # Verify u2 cannot see treasury diversion in personal wallet transactions
    u2_txs = await WalletService.list_transactions(test_db, u2.id)
    assert u2_txs["total"] == 0

    pool = await WalletService.get_or_create_treasury_pool(test_db)
    assert pool.balance_toman == 150_000
    assert pool.total_collected_toman == 150_000

    ghost_log = (
        await test_db.execute(
            select(TreasuryLog).where(TreasuryLog.action_type == "ghosted_referral_divert")
        )
    ).scalar_one_or_none()
    assert ghost_log is not None
    assert ghost_log.amount_toman == 100_000

    ghost_ledger = (
        await test_db.execute(
            select(CommissionLedger).where(
                CommissionLedger.user_id == u2.id,
                CommissionLedger.beneficiary_type == "treasury",
            )
        )
    ).scalar_one_or_none()
    assert ghost_ledger is not None
    assert ghost_ledger.settlement_status == "settled"
    assert ghost_ledger.amount_toman == 100_000


@pytest.mark.asyncio
async def test_block_with_subscription_ban_cancels_subs_and_blocks_checkout(test_db: AsyncSession, fake_redis):
    """Checkbox 2 immediately cancels active subscriptions and blocks future checkouts with 403."""
    tier = SubscriptionTier(
        code="silver",
        name_fa="اشتراک نقره‌ای",
        name_en="Silver",
        price_toman=900_000,
        price_usd=12.0,
        quota_gb=500,
        is_active=True,
    )
    user = User(
        full_name="Subscribed Gamer",
        username="sub_gamer",
        referral_code="SUBG01",
        console_auth_code="SG01",
        password_hash="h",
    )
    test_db.add_all([tier, user])
    await test_db.commit()
    await test_db.refresh(user)

    now = datetime.now(timezone.utc)
    active_sub = UserSubscription(
        user_id=user.id,
        tier_code="silver",
        start_date=now - timedelta(days=5),
        end_date=now + timedelta(days=25),
        status="active",
    )
    test_db.add(active_sub)
    await test_db.commit()

    await fake_redis.set(f"drgame:user:{user.id}:quota", '{"cached": true}')

    res = await WalletService.block_user_in_referral(
        db=test_db,
        admin_id=1,
        user_id=user.id,
        block_referral=True,
        block_subscription=True,
        reason="Chargeback abuse",
        redis=fake_redis,
    )
    assert res["cancelled_subscriptions_count"] == 1
    assert await fake_redis.get(f"drgame:user:{user.id}:quota") is None

    await test_db.refresh(active_sub)
    await test_db.refresh(user)
    assert active_sub.status == "cancelled"
    assert user.is_subscription_banned is True

    with pytest.raises(ForbiddenException):
        await SubscriptionService.process_checkout(
            db=test_db,
            redis=fake_redis,
            user_id=user.id,
            tier_code="silver",
            duration_months=1,
        )


@pytest.mark.asyncio
async def test_blacklisted_name_and_national_code_blocks_new_account_creation(test_db: AsyncSession):
    """Any user attempting to add a settlement bank account using a blacklisted holder name or national code is blocked."""
    bad_user = User(full_name="علی محمدی", username="ali_bad", referral_code="BAD001", console_auth_code="BD01", password_hash="h")
    new_user = User(full_name="کاربر جدید", username="fresh_u", referral_code="NEW002", console_auth_code="NW02", password_hash="h")
    test_db.add_all([bad_user, new_user])
    await test_db.commit()
    await test_db.refresh(bad_user)
    await test_db.refresh(new_user)

    # Register existing settlement account on bad_user before blacklisting so national_code is captured
    acc_bad = SettlementAccount(
        user_id=bad_user.id,
        account_type="bank_iran",
        sheba_number="IR1100000000000000000001",
        account_holder="علی محمدی",
        national_code="0012345678",
        bank_name="ملت",
    )
    test_db.add(acc_bad)
    await test_db.commit()

    await WalletService.block_user_in_referral(
        db=test_db,
        admin_id=1,
        user_id=bad_user.id,
        block_referral=True,
        block_subscription=False,
        reason="Repeated fraud",
    )

    # New user tries Arabic Yeh variant & extra space for same holder name -> MUST fail
    with pytest.raises(BadRequestException):
        await WalletService.add_settlement_account(
            db=test_db,
            user_id=new_user.id,
            account_type="bank_iran",
            sheba_number="IR2200000000000000000002",
            account_holder="علي   محمدي",
            bank_name="ملی",
        )

    # New user tries different name, but blacklisted Persian-numeral national_code -> MUST fail
    with pytest.raises(BadRequestException):
        await WalletService.add_settlement_account(
            db=test_db,
            user_id=new_user.id,
            account_type="bank_iran",
            sheba_number="IR2200000000000000000003",
            account_holder="سارا احمدی",
            national_code="۰۰۱۲۳۴۵۶۷۸",
            bank_name="ملی",
        )

    # Unblocking bad_user lifts the restriction cleanly
    await WalletService.unblock_user_in_referral(db=test_db, admin_id=1, user_id=bad_user.id)
    ok_acc = await WalletService.add_settlement_account(
        db=test_db,
        user_id=new_user.id,
        account_type="bank_iran",
        sheba_number="IR2200000000000000000004",
        account_holder="علی محمدی",
        bank_name="ملی",
    )
    assert ok_acc.id is not None


@pytest.mark.asyncio
async def test_release_user_pending_commission_and_global_settlement(test_db: AsyncSession):
    """Per-user release settles only the target user while leaving others pending until global batch executes."""
    u1 = User(full_name="Partner One", username="partner1", referral_code="PTN001", console_auth_code="P101", password_hash="h")
    u2 = User(full_name="Partner Two", username="partner2", referral_code="PTN002", console_auth_code="P202", password_hash="h")
    test_db.add_all([u1, u2])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)

    w1 = await WalletService.get_or_create_wallet(test_db, u1.id)
    w2 = await WalletService.get_or_create_wallet(test_db, u2.id)
    w1.pending_balance_toman = 150_000
    w2.pending_balance_toman = 80_000

    l1 = CommissionLedger(
        order_payment_id=101,
        beneficiary_type="user",
        user_id=u1.id,
        tier_level=1,
        amount_toman=100_000,
        settlement_status="pending",
        description="Pending 1A",
    )
    l2 = CommissionLedger(
        order_payment_id=102,
        beneficiary_type="user",
        user_id=u1.id,
        tier_level=1,
        amount_toman=50_000,
        settlement_status="pending",
        description="Pending 1B",
    )
    l3 = CommissionLedger(
        order_payment_id=103,
        beneficiary_type="user",
        user_id=u2.id,
        tier_level=1,
        amount_toman=80_000,
        settlement_status="pending",
        description="Pending 2A",
    )
    test_db.add_all([l1, l2, l3])
    await test_db.commit()

    # Release ONLY u1
    res_u1 = await WeeklySettlementService.release_user_pending_commission(
        db=test_db,
        user_id=u1.id,
        executed_by_admin_id=10,
    )
    assert res_u1["status"] == "success"
    assert res_u1["settled_amount_toman"] == 150_000
    assert res_u1["transactions_count"] == 2
    assert res_u1["new_withdrawable_balance"] == 150_000

    await test_db.refresh(w1)
    await test_db.refresh(w2)
    assert w1.pending_balance_toman == 0
    assert w1.withdrawable_balance_toman == 150_000
    assert w2.pending_balance_toman == 80_000
    assert w2.withdrawable_balance_toman == 0

    # Global settlement now settles ONLY u2
    res_global = await WeeklySettlementService.execute_weekly_settlement(db=test_db, executed_by_admin_id=10)
    assert res_global["status"] == "success"
    assert res_global["settled_amount_toman"] == 80_000
    assert res_global["beneficiaries_count"] == 1

    await test_db.refresh(w2)
    assert w2.pending_balance_toman == 0
    assert w2.withdrawable_balance_toman == 80_000

    # Re-running empty global settlement returns status='empty' cleanly without crashing
    res_empty = await WeeklySettlementService.execute_weekly_settlement(db=test_db, executed_by_admin_id=10)
    assert res_empty["status"] == "empty"
    assert res_empty["settled_amount_toman"] == 0


@pytest.mark.asyncio
async def test_admin_referral_http_endpoints_and_audit_logs(client: AsyncClient, test_db: AsyncSession):
    """End-to-end API checks for /chains, /blacklist, /users/{id}/blacklist, and /settlement/release-user/{id}."""
    ref_admin_crud = ReferralAdmin(
        username="ref_crud",
        email="ref_crud@drgame.local",
        password_hash=hash_password("pass"),
        full_name="Ref CRUD",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    ref_admin_ro = ReferralAdmin(
        username="ref_ro",
        email="ref_ro@drgame.local",
        password_hash=hash_password("pass"),
        full_name="Ref RO",
        access_level=AdminAccessLevel.READ_ONLY.value,
        is_active=True,
    )
    referrer = User(full_name="معرف تست", username="ref_u", referral_code="RHTTP1", console_auth_code="RH01", password_hash="h")
    child = User(full_name="زیرمجموعه تست", username="child_u", referral_code="CHTTP2", console_auth_code="CH02", password_hash="h")
    test_db.add_all([ref_admin_crud, ref_admin_ro, referrer, child])
    await test_db.commit()
    await test_db.refresh(ref_admin_crud)
    await test_db.refresh(ref_admin_ro)
    await test_db.refresh(referrer)
    await test_db.refresh(child)

    await WalletService.bind_referral(test_db, child.id, "RHTTP1")

    w_ref = await WalletService.get_or_create_wallet(test_db, referrer.id)
    w_ref.pending_balance_toman = 75_000
    test_db.add(
        CommissionLedger(
            order_payment_id=500,
            beneficiary_type="user",
            user_id=referrer.id,
            tier_level=1,
            amount_toman=75_000,
            settlement_status="pending",
            description="Pending API test",
        )
    )
    await test_db.commit()

    crud_token, _, _ = create_department_admin_token(
        admin_id=ref_admin_crud.id,
        username=ref_admin_crud.username,
        scope="referral",
        access_level=AdminAccessLevel.FULL_CRUD.value,
    )
    ro_token, _, _ = create_department_admin_token(
        admin_id=ref_admin_ro.id,
        username=ref_admin_ro.username,
        scope="referral",
        access_level=AdminAccessLevel.READ_ONLY.value,
    )

    # Read-only cannot blacklist or release commissions
    ro_block = await client.post(
        f"/api/admin-referral/users/{child.id}/blacklist",
        json={"block_referral": True, "block_subscription": False, "reason": "Unauthorized"},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_block.status_code == 403

    # Full-CRUD blacklists child
    block_res = await client.post(
        f"/api/admin-referral/users/{child.id}/blacklist",
        json={"block_referral": True, "block_subscription": True, "reason": "Spam chain"},
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert block_res.status_code == 200
    assert block_res.json()["block_referral"] is True
    assert block_res.json()["block_subscription"] is True

    # GET /blacklist returns the active entry
    bl_list = await client.get(
        "/api/admin-referral/blacklist?page=1&limit=50",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert bl_list.status_code == 200
    bl_data = bl_list.json()
    assert bl_data["total"] == 1
    assert bl_data["items"][0]["user_id"] == child.id
    assert bl_data["items"][0]["reason"] == "Spam chain"

    # GET /chains enriches blocked status
    chains_res = await client.get(
        "/api/admin-referral/chains?page=1&limit=50",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert chains_res.status_code == 200
    chain_item = chains_res.json()["items"][0]
    assert chain_item["user_is_referral_blocked"] is True
    assert chain_item["user_is_subscription_banned"] is True

    # POST /settlement/release-user/{referrer.id}
    rel_res = await client.post(
        f"/api/admin-referral/settlement/release-user/{referrer.id}",
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert rel_res.status_code == 200
    rel_data = rel_res.json()
    assert rel_data["settled_amount_toman"] == 75_000
    assert rel_data["new_withdrawable_balance"] == 75_000

    # DELETE /users/{child.id}/blacklist
    unblock_res = await client.delete(
        f"/api/admin-referral/users/{child.id}/blacklist",
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert unblock_res.status_code == 200

    bl_after = await client.get(
        "/api/admin-referral/blacklist?page=1&limit=50",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert bl_after.json()["total"] == 0

    # Verify AuditLog captured all 3 mutations
    logs = (await test_db.execute(select(AdminAuditLog))).scalars().all()
    actions = {l.action for l in logs}
    assert "BLACKLIST_REFERRAL_USER" in actions
    assert "RELEASE_USER_COMMISSION" in actions
    assert "UNBLOCK_REFERRAL_USER" in actions
