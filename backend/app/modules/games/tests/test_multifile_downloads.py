"""Unit tests for 5-part download files, tier restrictions, instant quota deduction, and no re-download policy."""
import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
from app.modules.subscriptions.models import UserSubscription
from app.modules.quota.models import UserQuota
from app.modules.games.services import GamesService
from app.core.exceptions import ForbiddenException, BadRequestException
from tests.conftest import FakeRedis


@pytest.mark.asyncio
async def test_multifile_downloads_and_tier_restriction(test_db: AsyncSession):
    fake_redis = FakeRedis()

    # 1. Create a game
    game = Game(
        rawg_id=8881,
        title_fa="بازی آزمایشی",
        title_en="Test Game",
        slug="test-game",
        rating=4.8,
        download_size_gb=50.0,
        platforms=["PS5"],
        genres=["Action"],
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # 2. Add 2 download files: One for Gold only, one for Bronze/Silver/Gold
    gold_file = await GamesService.admin_create_download_file(
        db=test_db,
        game_id=game.id,
        data={
            "file_type": "dubbing",
            "title": "دوبله اختصاصی طلایی",
            "file_size_gb": 2.5,
            "download_url": "https://cdn.drgame.ir/dubbing/test.pkg",
            "allowed_tiers": ["gold"],
        },
    )

    bronze_file = await GamesService.admin_create_download_file(
        db=test_db,
        game_id=game.id,
        data={
            "file_type": "data",
            "title": "دیتای رسمی بازی پارت ۱",
            "file_size_gb": 10.0,
            "download_url": "https://cdn.drgame.ir/data/part1.pkg",
            "allowed_tiers": ["bronze", "silver", "gold"],
        },
    )

    # 3. Create a user with Bronze subscription and 20GB quota
    user = User(
        full_name="Bronze User",
        username="bronze_user",
        referral_code="REFBRZ",
        console_auth_code="CBZ01",
        password_hash="h",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    now = datetime.now(timezone.utc)
    sub = UserSubscription(
        user_id=user.id,
        tier_code="bronze",
        start_date=now,
        end_date=now + timedelta(days=30),
        status="active",
    )
    test_db.add(sub)

    quota = UserQuota(
        user_id=user.id,
        total_quota_gb=20.0,
        used_quota_gb=0.0,
        remaining_quota_gb=20.0,
    )
    test_db.add(quota)
    await test_db.commit()

    # 4. Attempt to download Gold-only file with Bronze subscription -> MUST FAIL with 403 Forbidden
    with pytest.raises(ForbiddenException):
        await GamesService.generate_download_file_link(
            db=test_db,
            redis=fake_redis,
            user_id=user.id,
            game_id=game.id,
            file_id=gold_file.id,
        )

    # 5. Download Bronze-allowed file -> MUST SUCCEED
    dl_res = await GamesService.generate_download_file_link(
        db=test_db,
        redis=fake_redis,
        user_id=user.id,
        game_id=game.id,
        file_id=bronze_file.id,
    )
    assert dl_res["status"] == "success"
    assert dl_res["file_size_gb"] == 10.0
    assert "token=" in dl_res["download_url"]
    assert dl_res["remaining_quota_gb"] == 10.0

    # Verify quota updated in DB
    refreshed_quota = await test_db.scalar(select(UserQuota).where(UserQuota.user_id == user.id))
    assert refreshed_quota.used_quota_gb == 10.0
    assert refreshed_quota.remaining_quota_gb == 10.0

    # 6. Check that record is added to UserDownloadHistory
    history = await GamesService.get_user_download_history(test_db, user.id)
    assert len(history) == 1
    assert history[0]["file_id"] == bronze_file.id
    assert history[0]["file_size_gb"] == 10.0
    assert history[0]["status"] == "completed"

    # 7. Strict NO re-download requirement:
    # A second request for the same file will deduct ANOTHER 10.0 GB quota (no free re-downloads)
    dl_res2 = await GamesService.generate_download_file_link(
        db=test_db,
        redis=fake_redis,
        user_id=user.id,
        game_id=game.id,
        file_id=bronze_file.id,
    )
    assert dl_res2["status"] == "success"
    assert dl_res2["remaining_quota_gb"] == 0.0

    # Third attempt should now fail due to Insufficient Quota (0.0 GB remaining)
    with pytest.raises(BadRequestException):
        await GamesService.generate_download_file_link(
            db=test_db,
            redis=fake_redis,
            user_id=user.id,
            game_id=game.id,
            file_id=bronze_file.id,
        )
