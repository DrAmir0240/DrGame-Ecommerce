"""Unit and integration tests for wallet, multi-tier referral waterfall and payouts."""
from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.wallet.models import (
    UserWallet,
    ReferralChain,
    CommissionLedger,
    SettlementAccount,
    WithdrawalRequest,
)
from app.modules.subscriptions.models import OrderPayment, UserSubscription
from app.modules.wallet.services import WalletService


@pytest.mark.asyncio
async def test_wallet_creation_and_binding(test_db: AsyncSession):
    # 1. Create two test users
    u1 = User(
        full_name="User Alpha",
        username="alpha",
        password_hash="hash",
        referral_code="ALPHA123",
        console_auth_code="ALPH123",
    )
    u2 = User(
        full_name="User Beta",
        username="beta",
        password_hash="hash",
        referral_code="BETA1234",
        console_auth_code="BETA123",
    )
    test_db.add_all([u1, u2])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)

    # 2. Get or create wallet
    wallet = await WalletService.get_or_create_wallet(test_db, u1.id)
    assert wallet.user_id == u1.id
    assert wallet.withdrawable_balance_toman == 0

    # 3. Bind Beta to Alpha
    chain = await WalletService.bind_referral(test_db, u2.id, "ALPHA123")
    assert chain is not None
    assert chain.referrer_id == u1.id
    assert chain.user_id == u2.id

    # 4. Verify upline chain
    uplines = await WalletService.get_upline_chain(test_db, u2.id)
    assert uplines == [u1.id]


@pytest.mark.asyncio
async def test_commission_waterfall_calculation(test_db: AsyncSession):
    # Setup 3 users: A -> B -> C
    user_a = User(full_name="User A", username="usera", password_hash="h", referral_code="REFA1234", console_auth_code="CA12345")
    user_b = User(full_name="User B", username="userb", password_hash="h", referral_code="REFB1234", console_auth_code="CB12345")
    user_c = User(full_name="User C", username="userc", password_hash="h", referral_code="REFC1234", console_auth_code="CC12345")
    test_db.add_all([user_a, user_b, user_c])
    await test_db.commit()
    await test_db.refresh(user_a)
    await test_db.refresh(user_b)
    await test_db.refresh(user_c)

    # Chain: B referred by A, C referred by B
    await WalletService.bind_referral(test_db, user_b.id, "REFA1234")
    await WalletService.bind_referral(test_db, user_c.id, "REFB1234")

    # Give User B an active paid subscription, User A NO subscription
    now = datetime.now(timezone.utc)
    sub_b = UserSubscription(
        user_id=user_b.id,
        tier_code="gold",
        start_date=now,
        end_date=now + timedelta(days=30),
        status="active",
    )
    test_db.add(sub_b)
    await test_db.commit()

    # User C makes a purchase: 1,000,000 Toman (10,000,000 IRR)
    payment = OrderPayment(
        user_id=user_c.id,
        tier_code="gold",
        original_price=10000000,
        discount_amount=0,
        final_price=10000000,
        transaction_ref="TEST-TX-100",
        status="paid",
    )
    test_db.add(payment)
    await test_db.commit()
    await test_db.refresh(payment)

    # Process Waterfall
    res = await WalletService.process_commission_waterfall(test_db, payment)
    assert res["status"] == "success"
    assert res["amount_toman"] == 1000000
    assert res["shop_share"] == 790000
    assert res["commission_pool"] == 210000

    # User B is Level 1 upline: gets 50% of 210,000 = 105,000 Toman
    wallet_b = await WalletService.get_or_create_wallet(test_db, user_b.id)
    assert wallet_b.withdrawable_balance_toman == 105000
    assert wallet_b.total_earned_toman == 105000

    # User A is Level 2 upline: 25% of 210,000 = 52,500 Toman, but has NO active sub!
    # So User A gets 0 and CEO gets the share
    wallet_a = await WalletService.get_or_create_wallet(test_db, user_a.id)
    assert wallet_a.withdrawable_balance_toman == 0


@pytest.mark.asyncio
async def test_settlement_and_withdrawal_flow(test_db: AsyncSession):
    user = User(full_name="Trader X", username="traderx", password_hash="h", referral_code="TRADEX12", console_auth_code="TR12345")
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Credit wallet with 200,000 Toman
    wallet = await WalletService.get_or_create_wallet(test_db, user.id)
    wallet.withdrawable_balance_toman = 200000
    await test_db.commit()

    # Add Sheba Bank Account
    account = await WalletService.add_settlement_account(
        db=test_db,
        user_id=user.id,
        account_type="bank_iran",
        sheba_number="IR1200000000000000000001",
        account_holder="Trader X",
        bank_name="بانک ملی",
    )
    assert account.id is not None
    assert account.sheba_number == "IR1200000000000000000001"

    # Request Withdrawal of 80,000 Toman
    withdrawal = await WalletService.request_payout(
        db=test_db,
        user_id=user.id,
        settlement_account_id=account.id,
        amount_toman=80000,
    )
    assert withdrawal.id is not None
    assert withdrawal.amount_toman == 80000
    assert withdrawal.status == "pending"

    # Verify wallet deduction
    await test_db.refresh(wallet)
    assert wallet.withdrawable_balance_toman == 120000
    assert wallet.total_withdrawn_toman == 80000
