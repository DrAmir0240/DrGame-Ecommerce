"""Unit tests for infinite halving referral commission, pass-through bypass, and platform treasury pool."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.wallet.models import UserWallet, ReferralChain, SettlementAccount
from app.modules.wallet.treasury_models import ReferralTreasuryPool, TreasuryLog
from app.modules.wallet.services import WalletService
from app.modules.auth.identity_service import IdentityService
from app.core.exceptions import ForbiddenException, BadRequestException


@pytest.mark.asyncio
async def test_infinite_halving_commission_and_leftover_to_treasury(test_db: AsyncSession):
    # Setup chain: U1 -> U2 -> U3 -> Buyer
    u1 = User(full_name="User 1", username="user1", referral_code="REF001", console_auth_code="C01", password_hash="h")
    u2 = User(full_name="User 2", username="user2", referral_code="REF002", console_auth_code="C02", password_hash="h")
    u3 = User(full_name="User 3", username="user3", referral_code="REF003", console_auth_code="C03", password_hash="h")
    buyer = User(full_name="Buyer", username="buyer", referral_code="REFBUY", console_auth_code="C04", password_hash="h")
    test_db.add_all([u1, u2, u3, buyer])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)
    await test_db.refresh(u3)
    await test_db.refresh(buyer)

    # Bind chain
    await WalletService.bind_referral(test_db, u2.id, "REF001")     # U2 -> U1
    await WalletService.bind_referral(test_db, u3.id, "REF002")     # U3 -> U2
    await WalletService.bind_referral(test_db, buyer.id, "REF003")  # Buyer -> U3

    # Order: 1,000,000 Toman, base percent = 20% -> 200,000 Toman total budget
    # Layer 1 (U3): 50% of 200,000 = 100,000
    # Layer 2 (U2): 25% of 200,000 = 50,000
    # Layer 3 (U1): 12.5% of 200,000 = 25,000
    # Remainder: 200,000 - 175,000 = 25,000 -> ReferralTreasuryPool
    result = await WalletService.distribute_referral_commission(
        db=test_db,
        buyer_id=buyer.id,
        order_amount_toman=1000000,
        base_commission_percent=20.0,
    )

    assert result["status"] == "success"
    assert result["total_commission_budget"] == 200000
    assert result["distributed_sum"] == 175000
    assert result["leftover_amount"] == 25000
    assert result["layers_processed"] == 3

    # Check wallets
    w3 = await WalletService.get_or_create_wallet(test_db, u3.id)
    w2 = await WalletService.get_or_create_wallet(test_db, u2.id)
    w1 = await WalletService.get_or_create_wallet(test_db, u1.id)
    assert w3.withdrawable_balance_toman == 100000
    assert w2.withdrawable_balance_toman == 50000
    assert w1.withdrawable_balance_toman == 25000

    # Check Treasury Pool
    pool = await WalletService.get_or_create_treasury_pool(test_db)
    assert pool.balance_toman == 25000
    assert pool.total_collected_toman == 25000


@pytest.mark.asyncio
async def test_pass_through_bypass_for_hidden_referral_user(test_db: AsyncSession):
    # Setup chain: U1 -> U2 (HIDDEN) -> Buyer
    u1 = User(full_name="User Top", username="usertop", referral_code="REFTOP", console_auth_code="CT01", password_hash="h")
    u2 = User(full_name="User Hidden", username="userhidden", referral_code="REFHID", console_auth_code="CH02", password_hash="h", is_referral_hidden=True)
    buyer = User(full_name="Buyer 2", username="buyer2", referral_code="REFBUY2", console_auth_code="CB03", password_hash="h")
    test_db.add_all([u1, u2, buyer])
    await test_db.commit()
    await test_db.refresh(u1)
    await test_db.refresh(u2)
    await test_db.refresh(buyer)

    await WalletService.bind_referral(test_db, u2.id, "REFTOP")
    await WalletService.bind_referral(test_db, buyer.id, "REFHID")

    # Order: 1,000,000 Toman, base percent = 20% -> 200,000 Toman budget
    # U2 is hidden, so bypassed! U1 becomes effective Layer 1: 50% = 100,000
    # Leftover = 100,000 to treasury
    result = await WalletService.distribute_referral_commission(
        db=test_db,
        buyer_id=buyer.id,
        order_amount_toman=1000000,
        base_commission_percent=20.0,
    )

    assert result["status"] == "success"
    assert result["distributed_sum"] == 100000
    assert result["leftover_amount"] == 100000

    # Hidden user received 0
    w_hidden = await WalletService.get_or_create_wallet(test_db, u2.id)
    assert w_hidden.withdrawable_balance_toman == 0

    # Top user received Layer 1 commission directly
    w_top = await WalletService.get_or_create_wallet(test_db, u1.id)
    assert w_top.withdrawable_balance_toman == 100000


@pytest.mark.asyncio
async def test_treasury_pool_admin_reset_and_reward(test_db: AsyncSession):
    # Credit treasury pool
    await WalletService.credit_treasury_pool(test_db, 500000, description="تست اولیه صندوق")
    pool = await WalletService.get_or_create_treasury_pool(test_db)
    assert pool.balance_toman == 500000

    # Create recipient user
    user = User(full_name="Lucky Gamer", username="lucky", referral_code="REFLUCK", console_auth_code="CL01", password_hash="h")
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Grant reward from treasury
    reward_res = await WalletService.admin_grant_treasury_reward(
        test_db, user_id=user.id, amount_toman=150000, description="جایزه مسابقه عیدانه"
    )
    assert reward_res["status"] == "success"
    assert reward_res["remaining_treasury_balance"] == 350000

    # Check recipient wallet
    w = await WalletService.get_or_create_wallet(test_db, user.id)
    assert w.withdrawable_balance_toman == 150000

    # Reset treasury balance
    reset_res = await WalletService.admin_reset_treasury(test_db, description="صفر کردن پایان دوره")
    assert reset_res["status"] == "success"
    assert reset_res["reset_amount"] == 350000

    pool_after = await WalletService.get_or_create_treasury_pool(test_db)
    assert pool_after.balance_toman == 0


@pytest.mark.asyncio
async def test_identity_service_and_settlement_otp():
    # 1. Send OTP
    phone = "09129998877"
    otp_data = await IdentityService.send_phone_verification_otp(phone)
    assert otp_data["status"] == "sent"
    assert len(otp_data["test_otp_code"]) == 6

    # 2. National identity mock check
    id_res = await IdentityService.verify_national_identity(
        national_code="0011223344",
        phone=phone,
        iban="IR123456789012345678901234",
    )
    assert id_res["verified"] is True
    assert id_res["provider"] == "mock_shahkar"
