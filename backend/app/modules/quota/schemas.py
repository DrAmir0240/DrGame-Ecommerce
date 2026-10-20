from typing import Optional
from pydantic import BaseModel


class QuotaStatusOut(BaseModel):
    user_id: Optional[int] = None
    has_active_subscription: bool = False
    tier_name: Optional[str] = "No Active Plan"
    tier_slug: Optional[str] = "none"
    total_quota_bytes: int = 0
    used_quota_bytes: int = 0
    remaining_quota_bytes: int = 0
    total_quota_gb: float = 0.0
    used_quota_gb: float = 0.0
    remaining_quota_gb: float = 0.0
    used_percentage: float = 0.0
    formatted_pill_text: str = "GB 0"
    is_exhausted: bool = False
