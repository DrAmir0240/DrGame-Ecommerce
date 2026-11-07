"""API tests for wallet and referral router endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, create_access_token
from app.modules.users.models import User


@pytest.mark.asyncio
async def test_wallet_router_endpoints(client: AsyncClient, test_db: AsyncSession):
    # 1. Create a test user
    user = User(
        full_name="Referral Tester",
        username="reftester",
        password_hash=hash_password("password123"),
        referral_code="REFTEST1",
        console_auth_code="RT12345",
        is_active=True,
        is_verified=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token, jti, exp = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. GET /api/referral/stats
    res_stats = await client.get("/api/referral/stats", headers=headers)
    assert res_stats.status_code == 200
    data_stats = res_stats.json()
    assert data_stats["referral_code"] == "REFTEST1"
    assert data_stats["withdrawable_balance_toman"] == 0

    # 3. POST /api/referral/settlement-accounts (Create bank account)
    account_payload = {
        "account_type": "bank_iran",
        "sheba_number": "IR550170000000123456789012",
        "card_number": "6037997112345678",
        "account_holder": "تستر رفرال",
        "bank_name": "ملی",
    }
    res_acc = await client.post("/api/referral/settlement-accounts", json=account_payload, headers=headers)
    assert res_acc.status_code == 201
    acc_id = res_acc.json()["id"]

    # 4. GET /api/referral/settlement-accounts
    res_list = await client.get("/api/referral/settlement-accounts", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # 5. GET /api/referral/transactions
    res_tx = await client.get("/api/referral/transactions", headers=headers)
    assert res_tx.status_code == 200
    assert "items" in res_tx.json()

    # 6. Create invitee user and test POST /api/referral/bind
    invitee = User(
        full_name="Invitee Gamer",
        username="invitee_gamer",
        password_hash=hash_password("password123"),
        referral_code="INVITEE1",
        console_auth_code="IV12345",
        is_active=True,
        is_verified=True,
    )
    test_db.add(invitee)
    await test_db.commit()
    await test_db.refresh(invitee)

    invitee_token, _, _ = create_access_token(subject=invitee.id, claims={"username": invitee.username})
    invitee_headers = {"Authorization": f"Bearer {invitee_token}"}

    # Bind to referrer (User 1)
    bind_res = await client.post("/api/referral/bind", json={"referral_code": "REFTEST1"}, headers=invitee_headers)
    assert bind_res.status_code == 200
    assert bind_res.json()["status"] == "success"

    # Now verify referrer's network tree has 1 member
    tree_res = await client.get("/api/referral/network-tree", headers=headers)
    assert tree_res.status_code == 200
    tree_data = tree_res.json()
    assert tree_data["total_members"] == 1
    assert len(tree_data["levels"]) == 1
    assert tree_data["levels"][0]["level"] == 1
    assert tree_data["levels"][0]["members_count"] == 1

    # Verify referrer's stats direct_referrals_count is 1
    stats_updated = await client.get("/api/referral/stats", headers=headers)
    assert stats_updated.status_code == 200
    assert stats_updated.json()["direct_referrals_count"] == 1
