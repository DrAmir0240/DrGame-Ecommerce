"""Business logic service for support tickets and messaging."""
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.tickets.schemas import TicketCreate
from app.modules.users.notification_models import UserNotification


def utcnow():
    return datetime.now(timezone.utc)


class TicketService:
    @staticmethod
    async def create_ticket(db: AsyncSession, user_id: int, user_name: str, user_phone: Optional[str], payload: TicketCreate) -> Ticket:
        """Create a new ticket and record its initial message."""
        ticket = Ticket(
            user_id=user_id,
            user_name=user_name,
            user_phone=user_phone,
            subject=payload.subject,
            department=payload.department,
            priority=payload.priority,
            status="open",
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        db.add(ticket)
        await db.flush()

        initial_msg = TicketMessage(
            ticket_id=ticket.id,
            sender_type="user",
            sender_id=user_id,
            sender_name=user_name,
            message=payload.message,
            created_at=utcnow(),
        )
        db.add(initial_msg)
        await db.commit()
        await db.refresh(ticket)
        return ticket

    @staticmethod
    async def list_user_tickets(
        db: AsyncSession,
        user_id: int,
        status_filter: Optional[str] = None,
        department_filter: Optional[str] = None,
    ) -> List[Ticket]:
        """List tickets belonging to a user, with optional filters."""
        stmt = select(Ticket).where(Ticket.user_id == user_id)
        if status_filter and status_filter != "all":
            stmt = stmt.where(Ticket.status == status_filter)
        if department_filter and department_filter != "all":
            stmt = stmt.where(Ticket.department == department_filter)
        stmt = stmt.order_by(desc(Ticket.updated_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_ticket_detail(db: AsyncSession, ticket_id: int, user_id: Optional[int] = None) -> dict:
        """Get ticket and its conversation messages. Validates user ownership if user_id is passed."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="تیکت مورد نظر یافت نشد.")

        if user_id is not None and ticket.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما دسترسی به این تیکت ندارید.")

        msg_stmt = select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc())
        msg_res = await db.execute(msg_stmt)
        messages = list(msg_res.scalars().all())

        return {
            "id": ticket.id,
            "user_id": ticket.user_id,
            "user_name": ticket.user_name,
            "user_phone": ticket.user_phone,
            "subject": ticket.subject,
            "department": ticket.department,
            "priority": ticket.priority,
            "status": ticket.status,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "messages": messages,
        }

    @staticmethod
    async def reply_ticket_user(db: AsyncSession, ticket_id: int, user_id: int, user_name: str, message_text: str) -> TicketMessage:
        """Add a user reply to a ticket and update ticket status to user_reply."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="تیکت مورد نظر یافت نشد.")

        if ticket.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما دسترسی به این تیکت ندارید.")

        if ticket.status == "closed":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="این تیکت بسته شده است و امکان ارسال پاسخ وجود ندارد.")

        ticket.status = "user_reply"
        ticket.updated_at = utcnow()

        msg = TicketMessage(
            ticket_id=ticket.id,
            sender_type="user",
            sender_id=user_id,
            sender_name=user_name,
            message=message_text,
            created_at=utcnow(),
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    @staticmethod
    async def close_ticket_user(db: AsyncSession, ticket_id: int, user_id: int) -> Ticket:
        """Close a ticket by user."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="تیکت مورد نظر یافت نشد.")

        if ticket.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما دسترسی به این تیکت ندارید.")

        ticket.status = "closed"
        ticket.updated_at = utcnow()
        await db.commit()
        await db.refresh(ticket)
        return ticket

    @staticmethod
    async def list_admin_tickets(
        db: AsyncSession,
        status_filter: Optional[str] = None,
        department_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Ticket]:
        """Admin: list all tickets with filters and search query."""
        stmt = select(Ticket)
        if status_filter and status_filter != "all":
            stmt = stmt.where(Ticket.status == status_filter)
        if department_filter and department_filter != "all":
            stmt = stmt.where(Ticket.department == department_filter)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Ticket.subject.ilike(term),
                    Ticket.user_name.ilike(term),
                    Ticket.user_phone.ilike(term),
                )
            )
        stmt = stmt.order_by(desc(Ticket.updated_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def reply_ticket_admin(
        db: AsyncSession,
        ticket_id: int,
        admin_id: int,
        admin_name: str,
        message_text: str,
    ) -> TicketMessage:
        """Admin: reply to a ticket, change status to answered, and notify the user."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="تیکت مورد نظر یافت نشد.")

        ticket.status = "answered"
        ticket.updated_at = utcnow()

        msg = TicketMessage(
            ticket_id=ticket.id,
            sender_type="admin",
            sender_id=admin_id,
            sender_name=admin_name,
            message=message_text,
            created_at=utcnow(),
        )
        db.add(msg)

        # Create in-app notification for the user
        notif = UserNotification(
            user_id=ticket.user_id,
            title="پاسخ به تیکت پشتیبانی",
            message=f"تیم پشتیبانی به تیکت «{ticket.subject}» پاسخ داد.",
            notification_type="ticket_reply",
            is_read=False,
            created_at=utcnow(),
        )
        db.add(notif)

        await db.commit()
        await db.refresh(msg)
        return msg

    @staticmethod
    async def update_ticket_status_admin(db: AsyncSession, ticket_id: int, new_status: str) -> Ticket:
        """Admin: update status of a ticket."""
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="تیکت مورد نظر یافت نشد.")

        ticket.status = new_status
        ticket.updated_at = utcnow()
        await db.commit()
        await db.refresh(ticket)
        return ticket

    @staticmethod
    async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
        """Get ticket counts for a user."""
        total_stmt = select(func.count(Ticket.id)).where(Ticket.user_id == user_id)
        open_stmt = select(func.count(Ticket.id)).where(Ticket.user_id == user_id, Ticket.status.in_(["open", "user_reply"]))
        answered_stmt = select(func.count(Ticket.id)).where(Ticket.user_id == user_id, Ticket.status == "answered")
        closed_stmt = select(func.count(Ticket.id)).where(Ticket.user_id == user_id, Ticket.status == "closed")

        total = (await db.execute(total_stmt)).scalar() or 0
        open_c = (await db.execute(open_stmt)).scalar() or 0
        answered_c = (await db.execute(answered_stmt)).scalar() or 0
        closed_c = (await db.execute(closed_stmt)).scalar() or 0

        return {"total": total, "open": open_c, "answered": answered_c, "closed": closed_c}
