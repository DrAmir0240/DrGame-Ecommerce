from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ProfileOut(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    gamer_tag: Optional[str] = None
    xp: int = 0
    level: int = 1
    total_playtime_hours: int = 0
    streak_days: int = 0
    wallet_balance: Decimal = Decimal("0")

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    profile: Optional[ProfileOut] = None

    model_config = ConfigDict(from_attributes=True)
