"""Tests for Support Tickets module (Service & API)."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.modules.users.models import User
from app.modules.auth.admin_models import AdminUser
from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.tickets.services import TicketService
from app.modules.tickets.schemas import TicketCreate
from app.modules.users.notification_models import UserNotification


@pytest.mark.asyncio
async def test_ticket_service_lifecycle(test_db: AsyncSession):
    """Test creating ticket, user reply, admin reply, close, and stats."""
    # 1. Create a user
    user = User(
        username="ticket_tester",
        email="ticket@example.com",
        phone="09120001122",
        full_name="تستر تیکت",
        password_hash="hash",
        console_auth_code="7778881",
        referral_code="TICKET01",
    )
    test_db.add(user)
    await test_db.flush()

    # 2. Create ticket
    payload = TicketCreate(
        subject="مشکل در دانلود دیتای بازی",
        department="technical",
        priority="urgent",
        message="سلام، دیتای بازی در کنسول با خطای شبکه مواجه می‌شود.",
    )
    ticket = await TicketService.create_ticket(
        db=test_db,
        user_id=user.id,
        user_name=user.full_name,
        user_phone=user.phone,
        payload=payload,
    )
    assert ticket.id is not None
    assert ticket.status == "open"
    assert ticket.subject == "مشکل در دانلود دیتای بازی"

    # 3. Check detail
    detail = await TicketService.get_ticket_detail(db=test_db, ticket_id=ticket.id, user_id=user.id)
    assert len(detail["messages"]) == 1
    assert detail["messages"][0].message == "سلام، دیتای بازی در کنسول با خطای شبکه مواجه می‌شود."

    # 4. User sends a reply
    user_reply = await TicketService.reply_ticket_user(
        db=test_db,
        ticket_id=ticket.id,
        user_id=user.id,
        user_name=user.full_name,
        message_text="کد ارور NW-31295-0 است.",
    )
    assert user_reply.id is not None
    assert ticket.status == "user_reply"

    # 5. Admin replies
    admin_reply = await TicketService.reply_ticket_admin(
        db=test_db,
        ticket_id=ticket.id,
        admin_id=999,
        admin_name="پشتیبان فنی دکتر گیم",
        message_text="لطفاً DNS اختصاصی ۱۶۵.۲۲۷.۸۳.۱۴۵ را تنظیم فرمایید.",
    )
    assert admin_reply.sender_type == "admin"
    assert ticket.status == "answered"

    # Verify notification created
    from sqlalchemy import select
    notif = await test_db.scalar(
        select(UserNotification).where(
            UserNotification.user_id == user.id,
            UserNotification.notification_type == "ticket_reply"
        )
    )
    assert notif is not None
    assert "پاسخ" in notif.title

    # 6. Check stats
    stats = await TicketService.get_user_stats(db=test_db, user_id=user.id)
    assert stats["total"] >= 1
    assert stats["answered"] >= 1

    # 7. Close ticket
    closed_ticket = await TicketService.close_ticket_user(db=test_db, ticket_id=ticket.id, user_id=user.id)
    assert closed_ticket.status == "closed"


@pytest.mark.asyncio
async def test_ticket_api_flow(test_db: AsyncSession, client: AsyncClient):
    """Test ticket API endpoints via AsyncClient."""
    from app.core.security import create_access_token

    user = User(
        username="ticket_api_user",
        email="t_api@example.com",
        phone="09199998877",
        full_name="کاربر تیکت",
        password_hash="hash",
        console_auth_code="7778882",
        referral_code="TICKET02",
    )
    test_db.add(user)
    await test_db.flush()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create ticket
    res = await client.post(
        "/api/tickets/me",
        headers=headers,
        json={
            "subject": "سوال مالی و تمدید اشتراک",
            "department": "financial",
            "priority": "normal",
            "message": "آیا تخفیف دوره‌ای برای پلن ۶ ماهه فعال است؟",
        },
    )
    assert res.status_code == 201
    data = res.json()
    ticket_id = data["id"]
    assert data["department"] == "financial"

    # 2. Get my tickets
    list_res = await client.get("/api/tickets/me", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Get ticket stats
    stats_res = await client.get("/api/tickets/me/stats", headers=headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["total"] >= 1

    # 4. Get ticket detail
    detail_res = await client.get(f"/api/tickets/me/{ticket_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["messages"]) >= 1

    # 5. Reply
    reply_res = await client.post(
        f"/api/tickets/me/{ticket_id}/reply",
        headers=headers,
        json={"message": "ممنون می‌شم سریع‌تر بررسی بفرمایید."},
    )
    assert reply_res.status_code == 201

    # 6. Close ticket
    close_res = await client.patch(f"/api/tickets/me/{ticket_id}/close", headers=headers)
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"
