"""Pydantic V2 schemas for authentication operations."""
from pydantic import BaseModel, ConfigDict, Field
from app.modules.users.schemas import UserOut

class OTPRequest(BaseModel):
    target: str = Field(..., description="Phone number or email address", min_length=5, max_length=255)

class OTPVerify(BaseModel):
    target: str = Field(..., min_length=5, max_length=255)
    code: str = Field(..., min_length=4, max_length=8)

class RegisterRequest(BaseModel):
    target: str = Field(..., description="Phone number or email address used for OTP")
    code: str = Field(..., description="OTP verification code received")
    full_name: str = Field(..., min_length=2, max_length=150)
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=6, max_length=100)
    referral_code: str | None = Field(None, description="Optional inviter referral code")

class PasswordLoginRequest(BaseModel):
    login: str = Field(..., description="Username, email or phone")
    password: str = Field(..., min_length=6)

class ConsoleLoginRequest(BaseModel):
    console_code: str = Field(..., min_length=6, max_length=10, description="7-digit alphanumeric console code")

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut

    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    message: str
    detail: str | None = None
