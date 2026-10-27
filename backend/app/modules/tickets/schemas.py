"""Pydantic V2 schemas for Support Tickets module."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=255)
    department: str = Field("technical", pattern="^(technical|financial|downloads|general)$")
    priority: str = Field("normal", pattern="^(normal|urgent)$")
    message: str = Field(..., min_length=2)


class TicketReply(BaseModel):
    message: str = Field(..., min_length=1)


class TicketStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|answered|user_reply|closed)$")


class TicketMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    sender_type: str
    sender_id: int
    sender_name: str
    message: str
    created_at: datetime


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    user_phone: Optional[str] = None
    subject: str
    department: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime


class TicketDetailOut(TicketOut):
    messages: List[TicketMessageOut] = []


class TicketStatsOut(BaseModel):
    total: int
    open: int
    answered: int
    closed: int
