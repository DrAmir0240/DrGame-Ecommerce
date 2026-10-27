"""Pydantic schemas for wallet, referral statistics, and settlement accounts."""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReferralSummaryResponse(BaseModel):
    referral_code: str
    withdrawable_balance_toman: int
    total_earned_toman: int
    total_withdrawn_toman: int
    direct_referrals_count: int
    active_subscriptions_count: int


class CommissionTransactionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_payment_id: int
    beneficiary_type: str
    tier_level: int
    amount_toman: int
    description: str
    created_at: datetime


class CommissionTransactionListResponse(BaseModel):
    items: list[CommissionTransactionItem]
    total: int
    page: int
    page_size: int


class SendPhoneOtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, description="شماره موبایل جهت دریافت کد تایید")


class SendPhoneOtpResponse(BaseModel):
    status: str
    phone: str
    expires_in_seconds: int
    test_otp_code: str
    message: str


class SettlementAccountCreate(BaseModel):
    account_type: str = Field(..., pattern="^(bank_iran|crypto)$")
    sheba_number: str | None = None
    card_number: str | None = None
    account_holder: str | None = None
    bank_name: str | None = None
    national_code: str | None = None
    phone: str | None = None
    otp_code: str | None = None
    crypto_wallet_address: str | None = None
    crypto_network: str | None = None


class SettlementAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    account_type: str
    sheba_number: str | None = None
    card_number: str | None = None
    account_holder: str | None = None
    bank_name: str | None = None
    national_code: str | None = None
    phone: str | None = None
    crypto_wallet_address: str | None = None
    crypto_network: str | None = None
    is_verified: bool
    is_active: bool
    created_at: datetime



class WithdrawalRequestCreate(BaseModel):
    settlement_account_id: int
    amount_toman: int = Field(..., ge=50000)


class WithdrawalRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    settlement_account_id: int
    amount_toman: int
    status: str
    created_at: datetime
