"""Comprehensive unit and integration tests for Step 14: Missing APIs and Contract Fulfillment."""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
from sqlalchemy import select
from app.modules.core.models import SiteSetting
from app.modules.core.services import CoreSettingsService
from app.modules.core.schemas import SiteSettingsUpdate
from app.modules.news.models import BlogCategory, BlogPost
from app.modules.news.services import NewsService
from app.modules.news.schemas import BlogPostCreate, BlogPostUpdate, BlogCategoryCreate
from app.modules.subscriptions.models import OrderPayment
from app.modules.wallet.models import UserWallet, SettlementAccount, WithdrawalRequest
from app.modules.wallet.services import WalletService
from app.modules.users.models import User
from app.modules.auth.services import AuthService
from app.modules.auth.schemas import OTPLoginRequest
from app.modules.admin.services import AdminService
from app.modules.admin.schemas import AdminUserUpdate


@pytest.mark.asyncio
async def test_financial_calculation_no_divide_by_10(test_db):
    """Verify that order payment commission does NOT divide Toman by 10."""
    user = User(username="test_buyer_14", full_name="Buyer 14", password_hash="hash", is_active=True)
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    order = OrderPayment(
        user_id=user.id,
        tier_code="gold",
        original_price=700000,
        discount_amount=0,
        final_price=700000,  # 700,000 Tomans
        payment_method="zarinpal",
        transaction_ref="TRX-14-TEST",
        status="success",
    )
    test_db.add(order)
    await test_db.commit()
    await test_db.refresh(order)

    # Mock distribute_referral_commission to check received amount_toman
    with patch.object(WalletService, "distribute_referral_commission") as mock_dist:
        mock_dist.return_value = {"status": "success"}
        res = await WalletService.process_commission_waterfall(test_db, order)
        mock_dist.assert_called_once()
        _, kwargs = mock_dist.call_args
        # The amount passed must be EXACTLY 700000, not 70000!
        assert kwargs["order_amount_toman"] == 700000


@pytest.mark.asyncio
async def test_site_settings_get_and_update(test_db):
    """Verify dynamic global SiteSettings creation and update."""
    # 1. Fetch default settings
    settings = await CoreSettingsService.get_settings(test_db, redis=None)
    assert settings.header_dns_primary == "165.227.83.145"
    assert settings.header_dns_secondary == "192.241.221.79"
    assert settings.server_is_online is True

    # 2. Update settings
    updated = await CoreSettingsService.update_settings(
        test_db,
        SiteSettingsUpdate(
            header_dns_primary="1.1.1.1",
            contact_phone="021-88889999",
            server_status_text="سرورها با حداکثر توان آنلاین هستند",
        ),
        redis=None,
    )
    assert updated.header_dns_primary == "1.1.1.1"
    assert updated.contact_phone == "021-88889999"
    assert "حداکثر توان" in updated.server_status_text


@pytest.mark.asyncio
async def test_admin_blog_crud(test_db):
    """Verify admin category and post creation, update, and deletion."""
    # 1. Create Category
    cat_data = BlogCategoryCreate(name_fa="اخبار کنسول", name_en="Console News", slug="console-news-14")
    cat = await NewsService.create_category(test_db, cat_data, redis=None)
    assert cat.id is not None
    assert cat.slug == "console-news-14"

    # 2. Create Post
    post_data = BlogPostCreate(
        title_fa="بررسی قابلیت‌های جدید پلی‌استیشن ۵ پرو",
        title_en="PS5 Pro Features Review",
        slug="ps5-pro-features-review",
        category_id=cat.id,
        content_fa="توضیحات کامل پردازنده گرافیکی ارتقایافته و PSSR.",
        cover_image_url="https://images.unsplash.com/photo-test.jpg",
        reading_time_min=8,
        is_published=True,
    )
    post = await NewsService.create_post(test_db, post_data, redis=None)
    assert post.id is not None
    assert post.title_fa == "بررسی قابلیت‌های جدید پلی‌استیشن ۵ پرو"

    # 3. List Posts for Admin
    admin_list = await NewsService.admin_list_posts(test_db, search="پلی‌استیشن ۵ پرو", category_id=cat.id)
    assert admin_list["total"] >= 1
    assert any(p["id"] == post.id for p in admin_list["items"])

    # 4. Update Post
    updated_post = await NewsService.update_post(
        test_db,
        post.id,
        BlogPostUpdate(reading_time_min=10, is_published=False),
        redis=None,
    )
    assert updated_post.reading_time_min == 10
    assert updated_post.is_published is False

    # 5. Delete Post
    del_res = await NewsService.delete_post(test_db, post.id, redis=None)
    assert del_res["status"] == "success"


@pytest.mark.asyncio
async def test_auth_login_with_otp(test_db):
    """Verify passwordless OTP login and session creation."""
    user = User(
        username="otp_tester_14",
        full_name="OTP Tester",
        phone="09129998877",
        password_hash="hash",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()

    mock_redis = MagicMock()
    client_info = {
        "device_name": "مرورگر فایرفاکس",
        "device_type": "desktop",
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla",
    }

    with patch.object(AuthService, "verify_otp", return_value=True):
        payload = OTPLoginRequest(target="09129998877", code="123456")
        token_res = await AuthService.login_with_otp(test_db, mock_redis, payload, client_info)
        assert token_res.access_token is not None
        assert token_res.user.phone == "09129998877"


@pytest.mark.asyncio
async def test_settlement_accounts_and_withdrawals_history(test_db):
    """Verify user withdrawal history and admin settlement account listing."""
    user = User(username="wallet_user_14", full_name="Wallet User", phone="09351112233", password_hash="hash", is_active=True)
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    acc = SettlementAccount(
        user_id=user.id,
        account_type="bank_iran",
        sheba_number="IR123456789012345678901234",
        card_number="6037991122334455",
        account_holder="کاربر تست",
        bank_name="ملی",
        is_verified=False,
        is_active=True,
    )
    test_db.add(acc)
    await test_db.commit()
    await test_db.refresh(acc)

    withdrawal = WithdrawalRequest(
        user_id=user.id,
        settlement_account_id=acc.id,
        amount_toman=150000,
        status="pending",
    )
    test_db.add(withdrawal)
    await test_db.commit()

    # User History
    history = await WalletService.list_user_withdrawals(test_db, user.id)
    assert len(history) >= 1
    assert history[0]["amount_toman"] == 150000
    assert history[0]["status"] == "pending"

    # Admin Listing
    admin_accounts = await WalletService.list_all_settlement_accounts_admin(test_db)
    assert len(admin_accounts) >= 1
    assert any(a["id"] == acc.id for a in admin_accounts)


@pytest.mark.asyncio
async def test_admin_user_profile_and_status_update(test_db):
    """Verify admin updating user profile fields and toggling active status."""
    user = User(username="user_to_edit_14", full_name="Old Name", email="old@drgame.ir", password_hash="hash", is_active=True)
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # 1. Update Profile
    update_res = await AdminService.update_user_basic(
        test_db,
        user.id,
        AdminUserUpdate(full_name="New Name 14", email="new14@drgame.ir"),
    )
    assert update_res["status"] == "success"
    await test_db.refresh(user)
    assert user.full_name == "New Name 14"
    assert user.email == "new14@drgame.ir"

    # 2. Toggle Status (Suspend)
    status_res = await AdminService.toggle_user_status(test_db, user.id, is_active=False)
    assert status_res["status"] == "success"
    await test_db.refresh(user)
    assert user.is_active is False

