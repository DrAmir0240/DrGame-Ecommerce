"""Integration tests for Admin API router endpoints."""
import pytest
from app.modules.admin.services import AdminService
from app.modules.users.models import User
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_admin_login_endpoint(client, test_db):
    """POST /api/admin/auth/login works and returns valid token."""
    # Seed superadmin
    await AdminService.seed_superadmin(test_db)

    # Valid credentials
    resp = await client.post(
        "/api/admin/auth/login",
        json={"username_or_email": "admin", "password": "DrGame@Admin2026!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["admin"]["username"] == "admin"

    # Invalid credentials
    resp_invalid = await client.post(
        "/api/admin/auth/login",
        json={"username_or_email": "admin", "password": "WrongPassword"},
    )
    assert resp_invalid.status_code == 401


@pytest.mark.asyncio
async def test_admin_route_guards(client, test_db):
    """Endpoints reject unauthenticated or non-admin requests."""
    # No auth header -> 401 or 403
    resp_no_auth = await client.get("/api/admin/stats")
    assert resp_no_auth.status_code in [401, 403]

    # Non-admin token -> 401
    user_token, _, _ = create_access_token(subject=1, claims={"username": "regular_user", "type": "access"})
    resp_user = await client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert resp_user.status_code in [401, 403]


@pytest.mark.asyncio
async def test_admin_authenticated_endpoints(client, test_db):
    """Admin token can access users, adjust quota, stats, and finance."""
    # Seed and login
    await AdminService.seed_superadmin(test_db)
    login_resp = await client.post(
        "/api/admin/auth/login",
        json={"username_or_email": "admin", "password": "DrGame@Admin2026!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /api/admin/auth/me
    me_resp = await client.get("/api/admin/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "admin"

    # /api/admin/stats
    stats_resp = await client.get("/api/admin/stats", headers=headers)
    assert stats_resp.status_code == 200
    assert "total_users" in stats_resp.json()

    # Create dummy user
    user = User(
        full_name="کاربر هدف ادمین",
        username="admin_target_user",
        phone="09351234567",
        password_hash="fake",
        referral_code="TRG1",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # /api/admin/users
    users_resp = await client.get("/api/admin/users", headers=headers)
    assert users_resp.status_code == 200
    assert users_resp.json()["total"] >= 1

    # /api/admin/users/{id}
    dossier_resp = await client.get(f"/api/admin/users/{user.id}", headers=headers)
    assert dossier_resp.status_code == 200
    assert dossier_resp.json()["user"]["username"] == "admin_target_user"

    # /api/admin/users/{id}/adjust-quota
    adjust_resp = await client.post(
        f"/api/admin/users/{user.id}/adjust-quota",
        headers=headers,
        json={"added_gb": 20.0, "reason": "افزایش سهمیه تست"},
    )
    assert adjust_resp.status_code == 200
    assert adjust_resp.json()["total_quota_gb"] == 25.0

    # /api/admin/finance/overview
    fin_resp = await client.get("/api/admin/finance/overview", headers=headers)
    assert fin_resp.status_code == 200
    assert "total_domestic_volume_toman" in fin_resp.json()

    # /api/admin/subscription-tiers (List)
    tiers_resp = await client.get("/api/admin/subscription-tiers", headers=headers)
    assert tiers_resp.status_code == 200
    tiers_list = tiers_resp.json()
    assert len(tiers_list) >= 4

    # /api/admin/subscription-tiers/bronze (Update features & durations)
    update_resp = await client.put(
        "/api/admin/subscription-tiers/bronze",
        headers=headers,
        json={
            "code": "bronze",
            "price_toman": 750000,
            "quota_gb": 550,
            "allow_data": True,
            "allow_cheat": False,
            "allow_dubbing": True,
            "durations": {
                "1": {"price_toman": 750000, "quota_gb": 550},
                "3": {"price_toman": 2200000, "quota_gb": 1650},
                "6": {"price_toman": 4300000, "quota_gb": 3300},
            }
        }
    )
    assert update_resp.status_code == 200
    bronze_updated = update_resp.json()
    assert bronze_updated["price_toman"] == 750000
    assert bronze_updated["allow_dubbing"] is True
    assert bronze_updated["durations"]["3_months"]["price_toman"] == 2200000
