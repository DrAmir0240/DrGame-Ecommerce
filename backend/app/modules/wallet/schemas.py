"""Pydantic schemas for wallet, referral statistics, and settlement accounts."""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReferralSummaryResponse(BaseModel):
    referral_code: str
    withdrawable_balance_toman: int
    pending_balance_toman: int = 0
    next_settlement_date: str | None = None
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
    settlement_status: str = "pending"
    settled_at: datetime | None = None
    settlement_batch_id: str | None = None
    created_at: datetime


class NetworkLevelStat(BaseModel):
    level: int
    percentage: float
    members_count: int
    active_subscribers_count: int
    total_earned_toman: int


class NetworkTreeResponse(BaseModel):
    total_members: int
    total_active_subscribers: int
    levels: list[NetworkLevelStat]


class ReferralMemberItem(BaseModel):
    user_id: int
    masked_username: str
    masked_phone: str | None = None
    level: int
    joined_at: datetime
    has_active_subscription: bool
    total_contributed_commission_toman: int


class ReferralMemberListResponse(BaseModel):
    items: list[ReferralMemberItem]
    total: int
    page: int
    page_size: int


class SettlementPreviewBeneficiary(BaseModel):
    user_id: int
    username: str
    full_name: str
    pending_amount_toman: int
    transactions_count: int


class SettlementPreviewResponse(BaseModel):
    total_pending_amount_toman: int
    total_pending_transactions: int
    total_beneficiaries: int
    beneficiaries: list[SettlementPreviewBeneficiary]
    period_end: datetime


class SettlementBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_code: str
    total_amount_toman: int
    total_transactions_count: int
    beneficiaries_count: int
    executed_by_type: str
    executed_by_admin_id: int | None = None
    period_start: datetime | None = None
    period_end: datetime
    created_at: datetime


class SettlementBatchListResponse(BaseModel):
    items: list[SettlementBatchResponse]
    total: int
    page: int
    page_size: int


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


class SettlementAccountUpdate(BaseModel):
    account_holder: str | None = None
    bank_name: str | None = None
    card_number: str | None = None
    sheba_number: str | None = None
    crypto_wallet_address: str | None = None
    crypto_network: str | None = None


class WithdrawalHistoryItem(BaseModel):
    id: int
    amount_toman: int
    settlement_account_id: int
    settlement_title: str
    account_type: str
    card_or_sheba: str | None = None
    status: str
    admin_note: str | None = None
    created_at: datetime
    processed_at: datetime | None = None


class BindReferralRequest(BaseModel):
    referral_code: str = Field(..., min_length=3, max_length=20, description="Inviter referral code")

