"""Support ticket and ticket messages SQLAlchemy models."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    user_phone = Column(String(32), nullable=True)
    subject = Column(String(255), nullable=False)
    department = Column(String(64), nullable=False, default="technical")  # technical, financial, downloads, general
    priority = Column(String(32), nullable=False, default="normal")      # normal, urgent
    status = Column(String(32), nullable=False, default="open")          # open, answered, user_reply, closed
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class TicketMessage(Base):
    __tablename__ = "support_ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, nullable=False, index=True)
    sender_type = Column(String(16), nullable=False)  # 'user' | 'admin'
    sender_id = Column(Integer, nullable=False)
    sender_name = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
