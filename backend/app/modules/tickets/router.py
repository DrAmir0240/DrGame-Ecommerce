"""FastAPI routes for user tickets and admin ticket management."""
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.admin_dependencies import get_current_admin
from app.modules.users.models import User
from app.modules.auth.admin_models import AdminUser
from app.modules.tickets.schemas import (
    TicketCreate,
    TicketReply,
    TicketStatusUpdate,
    TicketOut,
    TicketDetailOut,
    TicketMessageOut,
    TicketStatsOut,
)
from app.modules.tickets.services import TicketService

user_tickets_router = APIRouter(prefix="/tickets", tags=["Tickets"])
admin_tickets_router = APIRouter(prefix="/admin/tickets", tags=["Admin Tickets"])


# ==========================================
# User Ticket Endpoints
# ==========================================

@user_tickets_router.get("/me", response_model=List[TicketOut], status_code=status.HTTP_200_OK)
async def get_my_tickets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[str] = Query(None, description="Filter by status: open, answered, closed"),
    department: Optional[str] = Query(None, description="Filter by department"),
):
    """Retrieve all tickets created by current user."""
    return await TicketService.list_user_tickets(
        db=db,
        user_id=current_user.id,
        status_filter=status,
        department_filter=department,
    )


@user_tickets_router.get("/me/stats", response_model=TicketStatsOut, status_code=status.HTTP_200_OK)
async def get_my_ticket_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve ticket summary counts for current user."""
    return await TicketService.get_user_stats(db=db, user_id=current_user.id)


@user_tickets_router.post("/me", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_new_ticket(
    payload: TicketCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new support ticket with an initial message."""
    user_name = current_user.full_name or current_user.username
    return await TicketService.create_ticket(
        db=db,
        user_id=current_user.id,
        user_name=user_name,
        user_phone=getattr(current_user, "phone", None),
        payload=payload,
    )


@user_tickets_router.get("/me/{ticket_id}", response_model=TicketDetailOut, status_code=status.HTTP_200_OK)
async def get_my_ticket_detail(
    ticket_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get ticket detail along with full message thread."""
    return await TicketService.get_ticket_detail(
        db=db,
        ticket_id=ticket_id,
        user_id=current_user.id,
    )


@user_tickets_router.post("/me/{ticket_id}/reply", response_model=TicketMessageOut, status_code=status.HTTP_201_CREATED)
async def reply_to_ticket(
    ticket_id: int,
    payload: TicketReply,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """User sends a reply to their existing ticket."""
    user_name = current_user.full_name or current_user.username
    return await TicketService.reply_ticket_user(
        db=db,
        ticket_id=ticket_id,
        user_id=current_user.id,
        user_name=user_name,
        message_text=payload.message,
    )


@user_tickets_router.patch("/me/{ticket_id}/close", response_model=TicketOut, status_code=status.HTTP_200_OK)
async def close_my_ticket(
    ticket_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """User marks a ticket as closed."""
    return await TicketService.close_ticket_user(
        db=db,
        ticket_id=ticket_id,
        user_id=current_user.id,
    )


# ==========================================
# Admin Ticket Endpoints
# ==========================================

@admin_tickets_router.get("", response_model=List[TicketOut], status_code=status.HTTP_200_OK)
async def list_admin_tickets(
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[str] = Query(None, description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    search: Optional[str] = Query(None, description="Search user or subject"),
):
    """Admin: list all support tickets."""
    return await TicketService.list_admin_tickets(
        db=db,
        status_filter=status,
        department_filter=department,
        search=search,
    )


@admin_tickets_router.get("/{ticket_id}", response_model=TicketDetailOut, status_code=status.HTTP_200_OK)
async def get_admin_ticket_detail(
    ticket_id: int,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin: get ticket detail and conversation messages."""
    return await TicketService.get_ticket_detail(
        db=db,
        ticket_id=ticket_id,
        user_id=None,
    )


@admin_tickets_router.post("/{ticket_id}/reply", response_model=TicketMessageOut, status_code=status.HTTP_201_CREATED)
async def reply_admin_ticket(
    ticket_id: int,
    payload: TicketReply,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin: reply to ticket and notify user."""
    admin_name = current_admin.username or "پشتیبانی دکتر گیم"
    return await TicketService.reply_ticket_admin(
        db=db,
        ticket_id=ticket_id,
        admin_id=current_admin.id,
        admin_name=admin_name,
        message_text=payload.message,
    )


@admin_tickets_router.patch("/{ticket_id}/status", response_model=TicketOut, status_code=status.HTTP_200_OK)
async def update_ticket_status(
    ticket_id: int,
    payload: TicketStatusUpdate,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin: update status of a ticket."""
    return await TicketService.update_ticket_status_admin(
        db=db,
        ticket_id=ticket_id,
        new_status=payload.status,
    )
