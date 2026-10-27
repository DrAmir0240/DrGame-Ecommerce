"""Wallet and referral system router."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.wallet.schemas import (
    ReferralSummaryResponse,
    CommissionTransactionListResponse,
    SettlementAccountCreate,
    SettlementAccountResponse,
    WithdrawalRequestCreate,
    WithdrawalRequestResponse,
    SendPhoneOtpRequest,
    SendPhoneOtpResponse,
)
from app.modules.wallet.services import WalletService
from app.modules.auth.identity_service import IdentityService

router = APIRouter(tags=["Referral & Wallet"])


@router.post("/send-otp", response_model=SendPhoneOtpResponse, status_code=status.HTTP_200_OK)
async def send_settlement_otp(
    data: SendPhoneOtpRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Send test OTP to phone for settlement account verification."""
    return await IdentityService.send_phone_verification_otp(phone=data.phone)


@router.get("/stats", response_model=ReferralSummaryResponse, status_code=status.HTTP_200_OK)
async def get_referral_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get authenticated user's referral balance, total earned, and network metrics."""
    return await WalletService.get_referral_summary(db, current_user.id)


@router.get("/transactions", response_model=CommissionTransactionListResponse, status_code=status.HTTP_200_OK)
async def get_wallet_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Retrieve paginated commission and earning ledger transactions for the user."""
    return await WalletService.list_transactions(db, current_user.id, page, page_size)


@router.get("/settlement-accounts", response_model=List[SettlementAccountResponse], status_code=status.HTTP_200_OK)
async def get_settlement_accounts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get list of active settlement accounts (Iranian Sheba or Crypto wallet)."""
    return await WalletService.list_settlement_accounts(db, current_user.id)


@router.post("/settlement-accounts", response_model=SettlementAccountResponse, status_code=status.HTTP_201_CREATED)
async def add_settlement_account(
    data: SettlementAccountCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new domestic Iranian bank account or global crypto wallet."""
    return await WalletService.add_settlement_account(
        db=db,
        user_id=current_user.id,
        account_type=data.account_type,
        sheba_number=data.sheba_number,
        card_number=data.card_number,
        account_holder=data.account_holder,
        bank_name=data.bank_name,
        national_code=data.national_code,
        phone=data.phone,
        otp_code=data.otp_code,
        crypto_wallet_address=data.crypto_wallet_address,
        crypto_network=data.crypto_network,
    )


@router.post("/withdraw", response_model=WithdrawalRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_withdrawal(
    data: WithdrawalRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Request a payout/withdrawal from user's withdrawable wallet balance."""
    return await WalletService.request_payout(
        db=db,
        user_id=current_user.id,
        settlement_account_id=data.settlement_account_id,
        amount_toman=data.amount_toman,
    )
