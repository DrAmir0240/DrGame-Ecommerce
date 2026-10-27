"""Pydantic V2 schemas for users and profile."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")

class UserOut(UserBase):
    id: int
    email: str | None = None
    phone: str | None = None
    console_auth_code: str
    referral_code: str
    avatar_url: str | None = None
    hero_banner_url: str | None = None
    is_preset_avatar: bool = True
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    avatar_url: str | None = None
    hero_banner_url: str | None = None
    is_preset_avatar: bool | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

class UserSessionOut(BaseModel):
    id: int
    device_name: str
    device_type: str
    ip_address: str | None = None
    user_agent: str | None = None
    is_active: bool
    is_primary: bool = False
    last_active_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserNotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[UserNotificationOut]
    unread_count: int


class UserPaymentOut(BaseModel):
    id: int
    order_id: int
    tier_code: str
    tier_title: str
    provider: str
    currency: str
    original_price: int
    discount_amount: int
    amount: int
    status: str
    authority: str
    payment_id: str
    created_at: datetime
    created_at_jalali: str

    model_config = ConfigDict(from_attributes=True)
