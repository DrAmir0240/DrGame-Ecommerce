"""Comprehensive test suite for Step 24: Admin 500 error fixes and ticket priority validation."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password, create_access_token
from app.modules.admin.models import (
    ContentAdmin,
    FinanceAdmin,
    SupportAdmin,
    AdminAccessLevel,
)
from app.modules.users.models import User
from app.modules.subscriptions.models import OrderPayment, SubscriptionTier, UserSubscription


@pytest.mark.asyncio
async def test_step24_content_admin_genres_and_banners(client: AsyncClient, test_db: AsyncSession):
    """Test /api/admin-content/genres and /banners endpoints return 200 with complete CRUD."""
    # 1. Create content admin
    admin = ContentAdmin(
        username="content_fix_admin",
        email="content_fix@drgame.local",
        password_hash=hash_password("adminpass123"),
        full_name="Content Fixer",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    test_db.add(admin)
    await test_db.commit()

    login_res = await client.post("/api/admin-content/auth/login", json={
        "username": "content_fix_admin",
        "password": "adminpass123",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test GET /api/admin-content/genres (Previously failed with AttributeError: GameService.get_genres)
    genres_res = await client.get("/api/admin-content/genres", headers=headers)
    assert genres_res.status_code == 200
    assert isinstance(genres_res.json(), list)

    # 3. Test POST /api/admin-content/genres
    create_genre_res = await client.post("/api/admin-content/genres", headers=headers, json={
        "name_fa": "ماجراجویی فضایی",
        "name_en": "Space Adventure",
        "slug": "space-adventure",
        "is_active": True,
        "is_top8": False,
        "display_order": 10,
    })
    assert create_genre_res.status_code == 201
    genre_data = create_genre_res.json()
    genre_id = genre_data["id"]

    # 4. Test PUT /api/admin-content/genres/{id}
    update_genre_res = await client.put(f"/api/admin-content/genres/{genre_id}", headers=headers, json={
        "name_fa": "ماجراجویی کهکشانی",
    })
    assert update_genre_res.status_code == 200
    assert update_genre_res.json()["name_fa"] == "ماجراجویی کهکشانی"

    # 5. Test DELETE /api/admin-content/genres/{id}
    del_genre_res = await client.delete(f"/api/admin-content/genres/{genre_id}", headers=headers)
    assert del_genre_res.status_code == 200

    # 6. Test GET /api/admin-content/banners (Previously failed with AttributeError: HomeBanner.order_priority)
    banners_res = await client.get("/api/admin-content/banners", headers=headers)
    assert banners_res.status_code == 200
    assert isinstance(banners_res.json(), list)

    # 7. Test POST /api/admin-content/banners
    create_banner_res = await client.post("/api/admin-content/banners", headers=headers, json={
        "title": "بنر تست بازی‌های تخفیف‌دار",
        "image_url": "https://img.drgame.ir/test.jpg",
        "link_url": "/games?discount=true",
        "position": 1,
        "display_order": 1,
        "is_active": True,
    })
    assert create_banner_res.status_code == 201
    banner_id = create_banner_res.json()["id"]

    # 8. Test DELETE /api/admin-content/banners/{id}
    del_banner_res = await client.delete(f"/api/admin-content/banners/{banner_id}", headers=headers)
    assert del_banner_res.status_code == 200


@pytest.mark.asyncio
async def test_step24_finance_admin_transactions_and_discounts(client: AsyncClient, test_db: AsyncSession):
    """Test /api/admin-finance/transactions and /discounts endpoints return 200."""
    # 1. Create finance admin
    admin = FinanceAdmin(
        username="finance_fix_admin",
        email="finance_fix@drgame.local",
        password_hash=hash_password("adminpass123"),
        full_name="Finance Fixer",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    test_db.add(admin)
    await test_db.commit()

    login_res = await client.post("/api/admin-finance/auth/login", json={
        "username": "finance_fix_admin",
        "password": "adminpass123",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test GET /api/admin-finance/transactions (Previously failed with ImportError: OrderPayment from wallet.models)
    tx_res = await client.get("/api/admin-finance/transactions?page=1&limit=50", headers=headers)
    assert tx_res.status_code == 200
    tx_data = tx_res.json()
    assert "items" in tx_data
    assert "total" in tx_data
    assert tx_data["page_size"] == 50

    # 3. Test GET /api/admin-finance/discounts (Previously failed with AttributeError: AdminService.list_discounts)
    disc_res = await client.get("/api/admin-finance/discounts", headers=headers)
    assert disc_res.status_code == 200
    assert isinstance(disc_res.json(), list)

    # 4. Test POST /api/admin-finance/discounts
    create_disc_res = await client.post("/api/admin-finance/discounts", headers=headers, json={
        "code": "STEP24OFF",
        "percent": 25,
        "max_discount_toman": 50000,
        "max_uses": 100,
        "valid_until": "2027-01-01T00:00:00Z",
        "is_active": True,
    })
    assert create_disc_res.status_code == 201
    disc_id = create_disc_res.json()["id"]

    # 5. Test PUT /api/admin-finance/discounts/{id}
    update_disc_res = await client.put(f"/api/admin-finance/discounts/{disc_id}", headers=headers, json={
        "percent": 30,
    })
    assert update_disc_res.status_code == 200

    # 6. Test DELETE /api/admin-finance/discounts/{id}
    del_disc_res = await client.delete(f"/api/admin-finance/discounts/{disc_id}", headers=headers)
    assert del_disc_res.status_code == 200


@pytest.mark.asyncio
async def test_step24_support_admin_users_and_status_and_quota(client: AsyncClient, test_db: AsyncSession):
    """Test /api/admin-support/users, adjust-quota, and status endpoints return 200."""
    # 1. Create support admin and a regular user
    admin = SupportAdmin(
        username="support_fix_admin",
        email="support_fix@drgame.local",
        password_hash=hash_password("adminpass123"),
        full_name="Support Fixer",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    user = User(
        username="user_support_test",
        email="user_support@example.com",
        phone="09199998877",
        full_name="کاربر تست پشتیبانی",
        password_hash="hash",
        console_auth_code="8889991",
        referral_code="SUPP001",
        is_active=True,
    )
    test_db.add_all([admin, user])
    await test_db.commit()
    await test_db.refresh(user)

    login_res = await client.post("/api/admin-support/auth/login", json={
        "username": "support_fix_admin",
        "password": "adminpass123",
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test GET /api/admin-support/users (Previously failed with TypeError: 5 positional arguments to list_users)
    users_res = await client.get("/api/admin-support/users?page=1&limit=50", headers=headers)
    assert users_res.status_code == 200
    data = users_res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

    # 3. Test PUT /api/admin-support/users/{id}/adjust-quota (Frontend sends PUT with additional_gb)
    quota_res = await client.put(f"/api/admin-support/users/{user.id}/adjust-quota", headers=headers, json={
        "additional_gb": 15.0,
    })
    assert quota_res.status_code == 200
    assert quota_res.json()["status"] == "success"
    assert quota_res.json()["total_quota_gb"] >= 15.0

    # 4. Test PUT /api/admin-support/users/{id}/status (Previously failed with AttributeError: update_user_status)
    status_res = await client.put(f"/api/admin-support/users/{user.id}/status", headers=headers, json={
        "is_active": False,
    })
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "success"
    assert status_res.json()["is_active"] is False


@pytest.mark.asyncio
async def test_step24_ticket_creation_with_all_priorities(client: AsyncClient, test_db: AsyncSession):
    """Test user ticket creation with low, medium, and high priorities without 422 validation error."""
    user = User(
        username="ticket_val_tester",
        email="ticket_val@example.com",
        phone="09188887766",
        full_name="کاربر تیکت",
        password_hash="hash",
        console_auth_code="9998881",
        referral_code="TKTVAL01",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token_str, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token_str}"}

    for priority_val in ["low", "medium", "high", "normal", "urgent"]:
        res = await client.post("/api/tickets/me", headers=headers, json={
            "subject": f"تست تیکت اولویت {priority_val}",
            "department": "technical",
            "priority": priority_val,
            "message": "پیام تستی برای اعتبارسنجی پترن اولویت تیکت",
        })
        assert res.status_code == 201, f"Failed for priority={priority_val}: {res.text}"
        assert res.json()["priority"] == priority_val
