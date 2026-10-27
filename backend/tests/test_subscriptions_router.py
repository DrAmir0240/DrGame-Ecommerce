"""Integration tests for Subscriptions router endpoints: /api/subscriptions/*."""
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.modules.users.models import User

@pytest.mark.asyncio
async def test_subscriptions_router(client: AsyncClient, test_db):
    user = User(
        full_name="Subscriber Test",
        username="subscriber1",
        password_hash="hashedpass",
        is_active=True
    )
    test_db.add(user)
    await test_db.flush()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /api/subscriptions/tiers
    tiers_res = await client.get("/api/subscriptions/tiers")
    assert tiers_res.status_code == 200
    tiers_data = tiers_res.json()
    assert len(tiers_data) == 4

    # 2. GET /api/subscriptions/my-status (before purchase)
    status_res = await client.get("/api/subscriptions/my-status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["has_active_subscription"] is False

    # 3. POST /api/subscriptions/checkout (buy Bronze tier)
    checkout_res = await client.post(
        "/api/subscriptions/checkout",
        headers=headers,
        json={"tier_code": "bronze", "payment_method": "simulation"}
    )
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()
    assert checkout_data["status"] == "success"
    assert checkout_data["tier_code"] == "bronze"

    # 4. GET /api/subscriptions/my-status (after purchase)
    status_res2 = await client.get("/api/subscriptions/my-status", headers=headers)
    assert status_res2.status_code == 200
    assert status_res2.json()["has_active_subscription"] is True
    assert status_res2.json()["tier"]["code"] == "bronze"
    assert status_res2.json()["quota"]["total_quota_gb"] >= 500.0
