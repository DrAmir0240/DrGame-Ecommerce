from datetime import datetime
from pydantic import BaseModel, Field


class ReferralSummaryOut(BaseModel):
    invite_code: str
    withdrawable_balance: int
    pending_balance: int
    total_invited: int
    commission_rate_percent: float = 21.0


class PayoutRequestIn(BaseModel):
    iban: str = Field(..., min_length=26, max_length=26, description="IRxxxxxxxxxxxxxxxxxxxxxxxx")
    account_holder: str = Field(..., min_length=3, max_length=100)
    amount: int = Field(..., ge=500000)


class PayoutRequestOut(BaseModel):
    success: bool
    tracking_id: str
    amount: int
    status: str
    message: str
