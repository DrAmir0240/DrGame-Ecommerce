from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class UserQuotaOut(BaseModel):
    user_id: int
    total_quota_gb: float
    used_quota_gb: float
    remaining_quota_gb: float
    percent_used: float
    tier_code: Optional[str] = None
    tier_name: Optional[str] = None
    expires_at: Optional[str] = None
    has_active_subscription: bool = False

    model_config = ConfigDict(from_attributes=True)

class QuotaCallbackRequest(BaseModel):
    user_id: int = Field(..., description="ID of the downloading user")
    game_id: int = Field(..., description="ID of the game downloaded")
    bytes_downloaded: int = Field(..., description="Total actual bytes transferred")
    download_server_id: str = Field(..., description="Identifier of the download node / CDN")
    signature: str = Field(..., description="HMAC-SHA256 signature calculated with WEBHOOK_SECRET_KEY")

class QuotaCallbackResponse(BaseModel):
    status: str
    gb_deducted: float
    remaining_quota_gb: float
