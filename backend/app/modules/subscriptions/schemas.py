"""Pydantic V2 schemas for subscription tiers, checkout and discount codes."""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class SubscriptionTierOut(BaseModel):
    id: int
    code: str
    name_fa: str
    name_en: str
    price_toman: int
    price_usd: float
    quota_gb: int
    speed_limit_mbps: int
    allowed_platforms: List[str] = []
    allow_data: bool = True
    allow_cheat: bool = False
    allow_dlc: bool = False
    allow_subtitles: bool = False
    allow_dubbing: bool = False
    allow_themes: bool = False
    durations: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)

class SubscriptionTierUpdate(BaseModel):
    code: str
    price_toman: Optional[int] = None
    quota_gb: Optional[int] = None
    allow_data: Optional[bool] = None
    allow_cheat: Optional[bool] = None
    allow_dlc: Optional[bool] = None
    allow_subtitles: Optional[bool] = None
    allow_dubbing: Optional[bool] = None
    durations: Optional[dict] = None

class SubscriptionTiersBatchUpdate(BaseModel):
    tiers: List[SubscriptionTierUpdate]

class DiscountValidateRequest(BaseModel):
    code: str
    original_price: int

class DiscountValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: int
    final_price: int

class CheckoutRequest(BaseModel):
    tier_code: str
    duration_months: int = Field(default=1, description="مدت زمان اشتراک (۱، ۳ یا ۶ ماه)")
    discount_code: Optional[str] = None
    payment_method: str = "simulation"

class CheckoutResponse(BaseModel):
    status: str
    transaction_ref: str
    tier_code: str
    tier_name: str
    duration_months: int = 1
    end_date: str
    quota: dict


class MySubscriptionStatus(BaseModel):
    has_active_subscription: bool
    tier: Optional[SubscriptionTierOut] = None
    end_date: Optional[str] = None
    quota: dict
