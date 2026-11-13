"""Automated tests for Step 26 bug fixes (DLC 404, Treasury double payout, Admin PATCH status)."""
import pytest
from datetime import datetime, timezone
from sqlalchemy import select

from app.modules.wallet.models import CommissionLedger, UserWallet
from app.modules.wallet.services import WalletService
from app.modules.wallet.settlement_service import WeeklySettlementService
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile
from app.modules.catalog_sync.services import CatalogSyncService
from app.modules.admin.models import SupportAdmin, AdminAccessLevel
from app.core.admin_dependencies import create_department_admin_token
from app.modules.users.models import User


@pytest.mark.asyncio
async def test_treasury_reward_does_not_double_payout(test_db):
    """Test that awarding treasury instant commission marks ledger as settled so weekly settlement skips it."""
    # 1. Setup user wallet and treasury pool
    test_user_id = 9991
    pool = await WalletService.get_or_create_treasury_pool(test_db)
    pool.balance_toman = 500000
    await test_db.commit()

    wallet = await WalletService.get_or_create_wallet(test_db, test_user_id)
    initial_withdrawable = wallet.withdrawable_balance_toman

    # 2. Award treasury bonus
    reward_amount = 50000
    await WalletService.admin_grant_treasury_reward(
        db=test_db,
        user_id=test_user_id,
        amount_toman=reward_amount,
        description="Test Treasury Bonus",
    )

    # Refresh wallet
    await test_db.refresh(wallet)
    assert wallet.withdrawable_balance_toman == initial_withdrawable + reward_amount

    # Verify ledger entry has settlement_status='settled'
    ledger = (await test_db.execute(
        select(CommissionLedger).where(
            CommissionLedger.user_id == test_user_id,
            CommissionLedger.amount_toman == reward_amount,
        )
    )).scalar_one_or_none()

    assert ledger is not None
    assert ledger.settlement_status == "settled"
    assert ledger.settled_at is not None

    # 3. Execute weekly settlement
    settle_res = await WeeklySettlementService.execute_weekly_settlement(test_db, executed_by_type="test")
    
    # Refresh wallet again - balance should NOT have received another reward_amount!
    await test_db.refresh(wallet)
    assert wallet.withdrawable_balance_toman == initial_withdrawable + reward_amount


@pytest.mark.asyncio
async def test_dlc_enrichment_binds_correct_database_file_id(test_db):
    """Test that _process_game_dlcs binds download_url using dlc_file.id instead of external IGDB id."""
    # Create test game
    game = Game(
        title_fa="بازی تست DLC",
        title_en="DLC Test Game",
        slug="dlc-test-game",
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # Mock combined items
    mock_dlcs = [
        {"id": 999888, "name": "Story Expansion Pack 1", "slug": "story-expansion-1"}
    ]

    service = CatalogSyncService()
    count = await service._process_game_dlcs(test_db, game.id, mock_dlcs, [])
    assert count == 1

    # Verify GameDownloadFile in db
    file_rec = (await test_db.execute(
        select(GameDownloadFile).where(
            GameDownloadFile.game_id == game.id,
            GameDownloadFile.file_type == "dlc",
        )
    )).scalar_one_or_none()

    assert file_rec is not None
    assert file_rec.id is not None
    # Download URL must contain file_rec.id, NOT 999888!
    assert file_rec.download_url == f"/api/games/{game.id}/downloads/{file_rec.id}/stream"
    assert "999888" not in file_rec.download_url


@pytest.mark.asyncio
async def test_admin_support_user_status_patch(client, test_db):
    """Test that PATCH /api/admin-support/users/{id}/status is supported alongside PUT."""
    # Seed support admin in test_db
    admin = SupportAdmin(
        id=1,
        username="support_admin",
        email="support@drgame.local",
        password_hash="hash",
        full_name="Support Officer",
        access_level=AdminAccessLevel.FULL_CRUD,
        is_active=True,
    )
    test_db.add(admin)

    # Seed target user
    target_user = User(
        id=555,
        full_name="Target User",
        username="targetuser",
        email="target@drgame.local",
        phone="09120000555",
        password_hash="dummy_hash",
        is_active=True,
    )
    test_db.add(target_user)
    await test_db.commit()

    token, _, _ = create_department_admin_token(
        admin_id=admin.id,
        username=admin.username,
        scope="support",
        access_level="full_crud",
    )

    resp = await client.patch(
        f"/api/admin-support/users/{target_user.id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"is_active": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "success"

    await test_db.refresh(target_user)
    assert target_user.is_active is False
