"""Unit tests for AdminService."""
import pytest
from app.modules.admin.services import AdminService
from app.modules.users.models import User
from app.modules.quota.models import UserQuota
from app.modules.wallet.models import UserWallet, SettlementAccount, WithdrawalRequest
from app.core.exceptions import AuthenticationError, NotFoundException, BadRequestException


@pytest.mark.asyncio
async def test_seed_and_login_superadmin(test_db):
    """AdminService can seed superadmin and log in."""
    admin = await AdminService.seed_superadmin(test_db)
    assert admin.username == "admin"
    assert admin.role == "superadmin"

    # Login success
    res = await AdminService.login(test_db, "admin", "DrGame@Admin2026!")
    assert "access_token" in res
    assert res["admin"]["username"] == "admin"

    # Login failure
    with pytest.raises(AuthenticationError):
        await AdminService.login(test_db, "admin", "wrong_pass")


@pytest.mark.asyncio
async def test_adjust_user_quota(test_db, mock_redis):
    """Admin can adjust user quota up and down."""
    user = User(
        full_name="کاربر تستی سهمیه",
        username="test_quota_user",
        phone="09129998877",
        email="quota@test.com",
        password_hash="fakehash",
        referral_code="QUOTA1",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Initial adjust adds quota
    res1 = await AdminService.adjust_user_quota(
        db=test_db,
        redis=mock_redis,
        user_id=user.id,
        added_gb=10.0,
        reason="پاداش جشنواره",
    )
    assert res1["status"] == "success"
    assert res1["total_quota_gb"] == 15.0  # 5 default + 10

    # Second adjust adds more
    res2 = await AdminService.adjust_user_quota(
        db=test_db,
        redis=mock_redis,
        user_id=user.id,
        added_gb=5.0,
    )
    assert res2["total_quota_gb"] == 20.0


@pytest.mark.asyncio
async def test_payout_processing_and_refund(test_db):
    """Admin payout approval and rejection (with refund)."""
    user = User(
        full_name="کاربر درخواست تسویه",
        username="payout_user",
        phone="09121112233",
        password_hash="fakehash",
        referral_code="PAYOUT1",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    wallet = UserWallet(
        user_id=user.id,
        withdrawable_balance_toman=0,
        total_withdrawn_toman=50000,
    )
    account = SettlementAccount(
        user_id=user.id,
        account_type="sheba",
        sheba_number="IR123456789012345678901234",
        is_verified=True,
    )
    test_db.add_all([wallet, account])
    await test_db.commit()
    await test_db.refresh(account)

    req = WithdrawalRequest(
        user_id=user.id,
        settlement_account_id=account.id,
        amount_toman=50000,
        status="pending",
    )
    test_db.add(req)
    await test_db.commit()
    await test_db.refresh(req)

    # Reject request -> refunds balance to wallet
    res = await AdminService.process_payout_request(
        test_db,
        request_id=req.id,
        new_status="rejected",
        admin_notes="شماره شبا مسدود است",
    )
    assert res["status"] == "rejected"

    await test_db.refresh(wallet)
    assert wallet.withdrawable_balance_toman == 50000


@pytest.mark.asyncio
async def test_game_crud_and_free_tier(test_db):
    """Admin game creation, update, and free tier selection."""
    game_data = {
        "title_fa": "بازی تستی ادمین",
        "title_en": "Admin Test Game",
        "download_size_gb": 45.5,
        "rating": 4.8,
    }
    game = await AdminService.create_game(test_db, game_data)
    assert game.id is not None
    assert game.title_en == "Admin Test Game"

    # Update
    updated = await AdminService.update_game(test_db, game.id, {"title_fa": "بازی ویرایش شده"})
    assert updated.title_fa == "بازی ویرایش شده"

    # Free tier games
    ids = await AdminService.set_free_tier_games(test_db, [game.id])
    assert ids == [game.id]

    free_games = await AdminService.list_free_tier_games(test_db)
    assert len(free_games) == 1
    assert free_games[0]["game_id"] == game.id


@pytest.mark.asyncio
async def test_discount_codes_crud(test_db):
    """Admin discount codes management."""
    data = {
        "code": "SUMMER2026",
        "discount_percent": 25,
        "max_discount_toman": 50000,
    }
    code = await AdminService.create_discount_code(test_db, data)
    assert code.code == "SUMMER2026"
    assert code.discount_percent == 25

    codes = await AdminService.list_discount_codes(test_db)
    assert len(codes) >= 1

    del_res = await AdminService.delete_discount_code(test_db, code.id)
    assert del_res["status"] == "deleted"
