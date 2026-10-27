"""Tests for User Notifications and Payment Invoices endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.main import app
from app.core.security import create_access_token
from app.modules.users.models import User
from app.modules.users.notification_models import UserNotification
from app.modules.subscriptions.models import OrderPayment


@pytest.mark.asyncio
async def test_user_notifications_flow(test_db: AsyncSession, client: AsyncClient):
    """Test get notifications, unread count, read single, read all, and delete."""
    user = User(
        username="notif_tester",
        email="notif@example.com",
        phone="09121113344",
        full_name="کاربر نوتیفیکیشن",
        password_hash="hash",
        console_auth_code="7778883",
        referral_code="NOTIF01",
    )
    test_db.add(user)
    await test_db.flush()

    # Add 2 notifications
    n1 = UserNotification(
        user_id=user.id,
        title="شارژ سهمیه جدید",
        message="سهمیه جدید شما با موفقیت شارژ شد.",
        notification_type="quota_reminder",
        is_read=False,
    )
    n2 = UserNotification(
        user_id=user.id,
        title="هشدار انقضای اشتراک",
        message="۳ روز تا پایان اشتراک شما باقیمانده است.",
        notification_type="expiry_reminder",
        is_read=False,
    )
    test_db.add_all([n1, n2])
    await test_db.commit()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get notifications
    res = await client.get("/api/users/me/notifications", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["unread_count"] == 2
    assert len(data["items"]) == 2

    # 2. Mark one as read
    patch_res = await client.patch(f"/api/users/me/notifications/{n1.id}/read", headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Check unread count decreased to 1
    res2 = await client.get("/api/users/me/notifications", headers=headers)
    assert res2.json()["unread_count"] == 1

    # 3. Mark all as read
    read_all_res = await client.post("/api/users/me/notifications/read-all", headers=headers)
    assert read_all_res.status_code == 200

    res3 = await client.get("/api/users/me/notifications", headers=headers)
    assert res3.json()["unread_count"] == 0

    # 4. Delete one notification
    del_res = await client.delete(f"/api/users/me/notifications/{n1.id}", headers=headers)
    assert del_res.status_code == 200

    res4 = await client.get("/api/users/me/notifications", headers=headers)
    assert len(res4.json()["items"]) == 1


@pytest.mark.asyncio
async def test_user_payments_history(test_db: AsyncSession, client: AsyncClient):
    """Test retrieving user payment history with Jalali date formatting."""
    user = User(
        username="pay_tester",
        email="pay@example.com",
        phone="09122224455",
        full_name="کاربر پرداخت",
        password_hash="hash",
        console_auth_code="7778884",
        referral_code="PAY01",
    )
    test_db.add(user)
    await test_db.flush()

    # Add a payment record
    payment = OrderPayment(
        user_id=user.id,
        tier_code="gold",
        original_price=1200000,
        discount_amount=200000,
        final_price=1000000,
        payment_method="zarinpal",
        transaction_ref="ZP-99887766",
        status="paid",
    )
    test_db.add(payment)
    await test_db.commit()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/users/me/payments", headers=headers)
    assert res.status_code == 200
    records = res.json()
    assert len(records) >= 1
    first = records[0]
    assert first["tier_code"] == "gold"
    assert first["amount"] == 1000000
    assert first["provider"] == "zarinpal"
    assert first["authority"] == "ZP-99887766"
    assert "۱۴۰" in first["created_at_jalali"] or "140" in first["created_at_jalali"]
