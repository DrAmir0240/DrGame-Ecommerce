from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class ValidateCouponIn(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)


class ValidateCouponOut(BaseModel):
    valid: bool
    code: str
    discount_percent: int
    message: str


class CheckoutIn(BaseModel):
    plan_id: str = Field(..., description="bronze, silver, gold")
    gateway: str = Field(default="zarinpal")
    coupon_code: Optional[str] = None


class CheckoutOut(BaseModel):
    success: bool
    tracking_code: str
    plan_name: str
    original_price: int
    discount_amount: int
    final_price: int
    quota_added_gb: int
    message: str


class OrderOut(BaseModel):
    id: int
    plan_id: str
    plan_name: str
    tracking_code: str
    final_price: int
    gateway: str
    status: str
    quota_credited_gb: int
    created_at: datetime

    class Config:
        from_attributes = True
