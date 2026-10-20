from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SubscriptionTierOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    duration_days: int
    quota_bytes: int
    quota_gb: float
    max_download_speed_mbps: int
    allowed_platforms: List[str]
    features: List[str]
    limitations: List[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserSubscriptionOut(BaseModel):
    id: int
    user_id: int
    tier_id: int
    tier_name: Optional[str] = None
    starts_at: datetime
    expires_at: datetime
    total_quota_bytes: int
    used_quota_bytes: int
    remaining_quota_bytes: int
    used_percentage: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
