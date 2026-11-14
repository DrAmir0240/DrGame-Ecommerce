"""Comprehensive integration tests for Step 28 Referral Admin Redesign & 3-Angle Chain Tracer."""
import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_dependencies import create_department_admin_token
from app.core.security import hash_password, create_access_token
from app.modules.admin.models import ReferralAdmin, AdminAccessLevel, AdminAuditLog
from app.modules.users.models import User
from app.modules.subscriptions.models import OrderPayment
from app.modules.subscriptions.services import SubscriptionService
from app.modules.wallet.models import (
    UserWallet,
    SettlementAccount,
    WithdrawalRequest,
    CommissionLedger,
)
from app.modules.wallet.services import WalletService


async def _create_admins(db: AsyncSession):
    crud_admin = ReferralAdmin(
        username="ref28_crud",
        email="ref28_crud@drgame.local",
        password_hash=hash_password("pass1234"),
        full_name="Referral CRUD",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    ro_admin = ReferralAdmin(
        username="ref28_ro",
        email="ref28_ro@drgame.local",
        password_hash=hash_password("pass1234"),
        full_name="Referral ReadOnly",
        access_level=AdminAccessLevel.READ_ONLY.value,
        is_active=True,
    )
    db.add_all([crud_admin, ro_admin])
    await db.commit()
    await db.refresh(crud_admin)
    await db.refresh(ro_admin)

    crud_token, _, _ = create_department_admin_token(
        admin_id=crud_admin.id,
        username=crud_admin.username,
        scope="referral",
        access_level=AdminAccessLevel.FULL_CRUD.value,
    )
    ro_token, _, _ = create_department_admin_token(
        admin_id=ro_admin.id,
        username=ro_admin.username,
        scope="referral",
        access_level=AdminAccessLevel.READ_ONLY.value,
    )
    return crud_admin, ro_admin, crud_token, ro_token


@pytest.mark.asyncio
async def test_payout_process_and_account_verification(client: AsyncClient, test_db: AsyncSession):
    """Verify payout approval, rejection wallet refund, settlement account verify, and RBAC read_only guards."""
    _, _, crud_token, ro_token = await _create_admins(test_db)

    u1 = User(full_name="علی رضایی", username="ali_payout", phone="09120001111", referral_code="PAY28A", console_auth_code="P28A", password_hash="h")
    u2 = User(full_name="سارا محمدی", username="sara_payout", phone="09120002222", referral_code="PAY28B", console_auth_code="P28B", password_hash="h")
    test_db.add_all([u1, u2])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)

    w1 = UserWallet(user_id=u1.id, withdrawable_balance_toman=100_000, total_withdrawn_toman=200_000)
    w2 = UserWallet(user_id=u2.id, withdrawable_balance_toman=0, total_withdrawn_toman=150_000)
    acc1 = SettlementAccount(
        user_id=u1.id,
        account_type="bank_iran",
        account_holder="علی رضایی",
        bank_name="ملت",
        national_code="0011223344",
        sheba_number="IR110120000000000000000001",
        card_number="6104337700001111",
        is_verified=False,
    )
    acc2 = SettlementAccount(
        user_id=u2.id,
        account_type="crypto",
        crypto_network="TRC20",
        crypto_wallet_address="TTestWalletAddress2888",
        is_verified=True,
    )
    test_db.add_all([w1, w2, acc1, acc2])
    await test_db.commit()
    await test_db.refresh(acc1)
    await test_db.refresh(acc2)

    req1 = WithdrawalRequest(user_id=u1.id, settlement_account_id=acc1.id, amount_toman=200_000, status="pending")
    req2 = WithdrawalRequest(user_id=u2.id, settlement_account_id=acc2.id, amount_toman=150_000, status="pending")
    test_db.add_all([req1, req2])
    await test_db.commit()
    await test_db.refresh(req1)
    await test_db.refresh(req2)

    # 1. Read-only admin blocked with 403 on write routes
    ro_verify = await client.put(
        f"/api/admin-referral/settlement-accounts/{acc1.id}/verify",
        json={"is_verified": True},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_verify.status_code == 403

    ro_process = await client.post(
        f"/api/admin-referral/payouts/{req1.id}/process",
        json={"new_status": "approved"},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_process.status_code == 403

    # 2. List settlement accounts with filters & search
    acc_res = await client.get(
        "/api/admin-referral/settlement-accounts?verified_filter=pending&search=0011223344",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert acc_res.status_code == 200
    acc_data = acc_res.json()
    assert acc_data["total"] == 1
    assert acc_data["items"][0]["username"] == "ali_payout"
    assert acc_data["summary"]["pending_count"] == 1
    assert acc_data["summary"]["verified_count"] == 1

    # 3. Verify bank account
    verify_res = await client.put(
        f"/api/admin-referral/settlement-accounts/{acc1.id}/verify",
        json={"is_verified": True},
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # 4. List payouts paginated & inspect target fields
    payouts_res = await client.get(
        "/api/admin-referral/payouts?status_filter=pending&search=ali_payout",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert payouts_res.status_code == 200
    p_data = payouts_res.json()
    assert p_data["total"] == 1
    assert p_data["summary"]["pending_count"] == 2
    assert p_data["summary"]["pending_amount_toman"] == 350_000
    assert p_data["items"][0]["sheba_number"] == "IR110120000000000000000001"
    assert p_data["items"][0]["bank_name"] == "ملت"

    # 5. Approve req1
    app_res = await client.post(
        f"/api/admin-referral/payouts/{req1.id}/process",
        json={"new_status": "approved", "admin_receipt_url": "TX-9988", "admin_notes": "واریز انجام شد"},
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

    # 6. Reject req2 -> wallet refunded
    rej_res = await client.post(
        f"/api/admin-referral/payouts/{req2.id}/process",
        json={"new_status": "rejected", "admin_notes": "کیف پول نامعتبر"},
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"

    await test_db.refresh(w2)
    assert w2.withdrawable_balance_toman == 150_000
    assert w2.total_withdrawn_toman == 0

    logs = (await test_db.execute(select(AdminAuditLog))).scalars().all()
    actions = {l.action for l in logs}
    assert "VERIFY_SETTLEMENT_ACCOUNT" in actions
    assert "PROCESS_PAYOUT" in actions


@pytest.mark.asyncio
async def test_three_angle_chain_tracer_waterfall_and_selective_settlement(
    client: AsyncClient, test_db: AsyncSession
):
    """
    Build a 4-level chain:
      root -> hidden_mid -> ghosted_mid -> leaf_buyer
    Verify /users/search, /tree/roots, /tree/{id}, /tree/{id}/children,
    /tree/{id}/simulate-waterfall, /commissions/recent-orders, /orders/{id}/trace,
    /chains, /overview, /settlement/release-selected, and /settlement/batches/{code}.
    """
    _, _, crud_token, ro_token = await _create_admins(test_db)

    root = User(full_name="ریشه شبکه", username="root_alpha", phone="09121000001", referral_code="ROOT28", console_auth_code="R28", password_hash="h")
    hidden_mid = User(full_name="واسطه مخفی", username="hidden_beta", phone="09121000002", referral_code="HID28", console_auth_code="H28", password_hash="h", is_referral_hidden=True)
    ghosted_mid = User(full_name="معرف مسدود", username="ghost_gamma", phone="09121000003", referral_code="GHO28", console_auth_code="G28", password_hash="h", is_referral_blocked=True)
    buyer = User(full_name="خریدار نهایی", username="buyer_delta", phone="09121000004", referral_code="BUY28", console_auth_code="B28", password_hash="h")

    test_db.add_all([root, hidden_mid, ghosted_mid, buyer])
    await test_db.commit()
    for u in (root, hidden_mid, ghosted_mid, buyer):
        await test_db.refresh(u)

    await WalletService.bind_referral(test_db, hidden_mid.id, "ROOT28")
    await WalletService.bind_referral(test_db, ghosted_mid.id, "HID28")
    await WalletService.bind_referral(test_db, buyer.id, "GHO28")

    # Create a real OrderPayment and run distribute_referral_commission (1,000,000 -> 210,000 budget)
    order = OrderPayment(
        user_id=buyer.id,
        tier_code="pro",
        original_price=1_000_000,
        discount_amount=0,
        final_price=1_000_000,
        payment_method="simulation",
        transaction_ref=f"TX-{uuid.uuid4().hex[:8]}",
        status="paid",
    )
    test_db.add(order)
    await test_db.commit()
    await test_db.refresh(order)

    await WalletService.distribute_referral_commission(
        db=test_db,
        buyer_id=buyer.id,
        order_amount_toman=1_000_000,
        order_payment_id=order.id,
        require_active_subscription=False,
    )

    # 1. Dry-run waterfall simulation for buyer on 1,000,000 Toman
    # Effective layers: ghosted_mid is effective L1 (105,000 -> treasury!), hidden_mid is bypassed, root is effective L2 (52,500 -> user!)
    sim_res = await client.get(
        f"/api/admin-referral/tree/{buyer.id}/simulate-waterfall?amount_toman=1000000",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["budget_21_toman"] == 210_000
    assert sim_data["user_credited_toman"] == 52_500
    assert sim_data["ghosted_treasury_toman"] == 105_000
    assert sim_data["leftover_treasury_toman"] == 52_500
    actions = [s["action"] for s in sim_data["steps"]]
    assert actions == ["ghosted_to_treasury", "bypass_hidden", "credit_user"]

    # 2. Recent orders & real Order Waterfall Trace
    recent_orders_res = await client.get(
        f"/api/admin-referral/commissions/recent-orders?user_id={root.id}",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert recent_orders_res.status_code == 200
    assert len(recent_orders_res.json()) == 1
    assert recent_orders_res.json()[0]["order_payment_id"] == order.id

    trace_res = await client.get(
        f"/api/admin-referral/orders/{order.id}/trace",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert trace_res.status_code == 200
    trace_data = trace_res.json()
    assert trace_data["summary"]["budget_21_toman"] == 210_000
    assert trace_data["summary"]["user_distributed_toman"] == 52_500
    assert trace_data["summary"]["treasury_diverted_toman"] == 157_500  # 105,000 ghosted + 52,500 leftover

    # 3. Search & Tree Roots & Multi-depth Children
    search_res = await client.get(
        "/api/admin-referral/users/search?q=hidden_beta",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert search_res.status_code == 200
    assert search_res.json()[0]["id"] == hidden_mid.id

    roots_res = await client.get(
        "/api/admin-referral/tree/roots?page=1&limit=10",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert roots_res.status_code == 200
    assert roots_res.json()["total"] == 1
    root_item = roots_res.json()["items"][0]
    assert root_item["user_id"] == root.id
    assert root_item["direct_downlines_count"] == 1
    assert root_item["total_subtree_count"] == 3

    buyer_tree = (
        await client.get(
            f"/api/admin-referral/tree/{buyer.id}",
            headers={"Authorization": f"Bearer {ro_token}"},
        )
    ).json()
    # Uplines from buyer: ghosted_mid (eff 1), hidden_mid (eff None), root (eff 2)
    assert [u["effective_layer"] for u in buyer_tree["uplines"]] == [1, None, 2]
    assert len(buyer_tree["recent_orders"]) == 1

    children_res = await client.get(
        f"/api/admin-referral/tree/{hidden_mid.id}/children",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert children_res.status_code == 200
    assert children_res.json()["items"][0]["user_id"] == ghosted_mid.id

    # 4. Enriched chains directory with root_user & depth
    chains_res = await client.get(
        "/api/admin-referral/chains?status_filter=blocked",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert chains_res.status_code == 200
    assert chains_res.json()["total"] >= 1
    assert chains_res.json()["items"][0]["root_user_id"] == root.id

    # 5. Overview metrics
    ov_res = await client.get("/api/admin-referral/overview", headers={"Authorization": f"Bearer {ro_token}"})
    assert ov_res.status_code == 200
    ov = ov_res.json()
    assert ov["metrics"]["pending_commissions_toman"] == 52_500
    assert ov["metrics"]["treasury_balance_toman"] == 157_500
    assert ov["metrics"]["total_chains_count"] == 3

    # 6. Selective batch release (blocked for RO, succeeds for CRUD)
    ro_sel = await client.post(
        "/api/admin-referral/settlement/release-selected",
        json={"user_ids": [root.id]},
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert ro_sel.status_code == 403

    sel_res = await client.post(
        "/api/admin-referral/settlement/release-selected",
        json={"user_ids": [root.id]},
        headers={"Authorization": f"Bearer {crud_token}"},
    )
    assert sel_res.status_code == 200
    sel_data = sel_res.json()
    assert sel_data["status"] == "success"
    assert sel_data["settled_amount_toman"] == 52_500
    batch_code = sel_data["batch_code"]
    assert batch_code.startswith("SELECT-SETTLE-")

    batch_det = await client.get(
        f"/api/admin-referral/settlement/batches/{batch_code}",
        headers={"Authorization": f"Bearer {ro_token}"},
    )
    assert batch_det.status_code == 200
    assert batch_det.json()["ledgers"][0]["username"] == "root_alpha"


@pytest.mark.asyncio
async def test_three_layer_manual_stack_and_payout_status_alias(
    client: AsyncClient, test_db: AsyncSession
):
    """
    Simulate 3 stacked layers (u0 -> u1 -> u2 -> u3) using manual bind + checkout,
    verify user referral endpoints show pending commissions across 3 levels,
    verify /admin-referral roots/chains/settlement/overview reflect them,
    and verify /admin-referral/payouts supports the ?status=PENDING alias.
    """
    await SubscriptionService.seed_tiers(test_db)
    _, _, _, ro_token = await _create_admins(test_db)
    admin_headers = {"Authorization": f"Bearer {ro_token}"}

    u0 = User(full_name="کاربر ریشه", username="stack_u0", phone="09012437401", referral_code="LUKP5EVY", console_auth_code="S0", password_hash="h", is_active=True, is_verified=True)
    u1 = User(full_name="لایه یک", username="stack_u1", phone="09012437402", referral_code="STACK1", console_auth_code="S1", password_hash="h", is_active=True, is_verified=True)
    u2 = User(full_name="لایه دو", username="stack_u2", phone="09012437403", referral_code="STACK2", console_auth_code="S2", password_hash="h", is_active=True, is_verified=True)
    u3 = User(full_name="لایه سه", username="stack_u3", phone="09012437404", referral_code="STACK3", console_auth_code="S3", password_hash="h", is_active=True, is_verified=True)
    test_db.add_all([u0, u1, u2, u3])
    await test_db.commit()
    for u in (u0, u1, u2, u3):
        await test_db.refresh(u)

    def _hdr(u: User) -> dict:
        tok, _, _ = create_access_token(subject=u.id, claims={"username": u.username})
        return {"Authorization": f"Bearer {tok}"}

    # Chain 3 layers: u0 -> u1 -> u2 -> u3
    assert (await client.post("/api/referral/bind", json={"referral_code": "LUKP5EVY"}, headers=_hdr(u1))).status_code == 200
    assert (await client.post("/api/referral/bind", json={"referral_code": "STACK1"}, headers=_hdr(u2))).status_code == 200
    assert (await client.post("/api/referral/bind", json={"referral_code": "STACK2"}, headers=_hdr(u3))).status_code == 200

    # All 4 users purchase Bronze subscriptions via checkout (so uplines qualify for commissions)
    for buyer in (u0, u1, u2, u3):
        co = await client.post(
            "/api/subscriptions/checkout",
            json={"tier_code": "bronze", "payment_method": "simulation"},
            headers=_hdr(buyer),
        )
        assert co.status_code == 200

    # 1. Verify u0 user panel endpoints show 3 levels and pending balance
    u0_stats = (await client.get("/api/referral/stats", headers=_hdr(u0))).json()
    assert u0_stats["direct_referrals_count"] == 1
    assert u0_stats["pending_balance_toman"] > 0
    assert u0_stats["withdrawable_balance_toman"] == 0

    u0_tree = (await client.get("/api/referral/network-tree", headers=_hdr(u0))).json()
    assert u0_tree["total_members"] == 3
    assert [lvl["level"] for lvl in u0_tree["levels"]] == [1, 2, 3]

    u0_members = (await client.get("/api/referral/members", headers=_hdr(u0))).json()
    assert u0_members["total"] == 3

    u0_tx = (await client.get("/api/referral/transactions", headers=_hdr(u0))).json()
    assert u0_tx["total"] == 3
    assert all(item["settlement_status"] == "pending" for item in u0_tx["items"])

    # 2. Verify Admin Referral overview, roots, chains, and weekly settlement preview see the stack
    overview = (await client.get("/api/admin-referral/overview", headers=admin_headers)).json()
    assert overview["metrics"]["total_chains_count"] >= 3
    assert overview["metrics"]["pending_commissions_toman"] > 0
    assert overview["metrics"]["pending_beneficiaries_count"] >= 3
    assert overview["metrics"]["pending_payouts_count"] == 0

    roots = (await client.get("/api/admin-referral/tree/roots?page=1&limit=20", headers=admin_headers)).json()
    u0_root = next((r for r in roots["items"] if r["user_id"] == u0.id), None)
    assert u0_root is not None
    assert u0_root["total_subtree_count"] == 3

    chains = (await client.get("/api/admin-referral/chains?page=1&limit=20", headers=admin_headers)).json()
    assert chains["total"] >= 3

    preview = (await client.get("/api/admin-referral/settlement/preview", headers=admin_headers)).json()
    preview_ids = {row["user_id"] for row in preview["beneficiaries"]}
    assert {u0.id, u1.id, u2.id}.issubset(preview_ids)

    # 3. Verify ?status=PENDING query alias filters payouts strictly to pending
    acc = SettlementAccount(
        user_id=u0.id,
        account_type="bank_iran",
        account_holder="کاربر ریشه",
        bank_name="ملت",
        national_code="0011223344",
        sheba_number="IR220120000000000000000002",
        is_verified=True,
    )
    test_db.add(acc)
    await test_db.commit()
    await test_db.refresh(acc)

    p_pending = WithdrawalRequest(user_id=u0.id, settlement_account_id=acc.id, amount_toman=60_000, status="pending")
    p_approved = WithdrawalRequest(user_id=u0.id, settlement_account_id=acc.id, amount_toman=50_000, status="approved")
    test_db.add_all([p_pending, p_approved])
    await test_db.commit()

    alias_res = await client.get("/api/admin-referral/payouts?status=PENDING&page=1&limit=10", headers=admin_headers)
    assert alias_res.status_code == 200
    alias_data = alias_res.json()
    assert alias_data["total"] == 1
    assert alias_data["items"][0]["status"] == "pending"
    assert alias_data["items"][0]["amount_toman"] == 60_000
