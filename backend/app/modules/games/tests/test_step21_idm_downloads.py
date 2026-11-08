"""Unit tests for Step 21: IDM direct link support, Range headers, and history 6-hour validity."""
import pytest
import time
import hashlib
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.modules.users.models import User
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
from app.modules.subscriptions.models import UserSubscription, SubscriptionTier
from app.modules.quota.models import UserQuota
from app.modules.games.services import GamesService
from tests.conftest import FakeRedis


@pytest.mark.asyncio
async def test_step21_idm_streaming_and_download_ticket(test_db: AsyncSession, client: AsyncClient, fake_redis: FakeRedis):
    # 1. Create User
    user = User(
        full_name="گیمر تستی",
        username="gamer_idm_tester",
        phone="09121112233",
        password_hash="fakehash",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # 2. Add Quota & Subscription
    quota = UserQuota(
        user_id=user.id,
        total_quota_gb=100.0,
        used_quota_gb=0.0,
        remaining_quota_gb=100.0,
    )
    test_db.add(quota)

    tier = SubscriptionTier(
        code="gold",
        name_en="Gold VIP",
        name_fa="اشتراک طلایی",
        price_toman=100000,
        quota_gb=100,
        allow_data=True,
    )
    test_db.add(tier)

    sub = UserSubscription(
        user_id=user.id,
        tier_code="gold",
        status="active",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + pytest.importorskip("datetime").timedelta(days=30),
    )
    test_db.add(sub)

    # 3. Create Game
    game = Game(
        rawg_id=9991,
        title_fa="بازی سایبرپانک",
        title_en="Cyberpunk Test",
        slug="cyberpunk-test",
        rating=4.9,
        download_size_gb=40.0,
        platforms=["PS5"],
        genres=["RPG"],
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # 4. Generate Download Ticket
    ticket = await GamesService.generate_download_ticket(
        db=test_db,
        redis=fake_redis,
        user_id=user.id,
        game_id=game.id,
        format_category="fpkg",
    )
    assert ticket["status"] == "success"
    assert "/api/games/" in ticket["download_url"]
    assert ticket["file_size_gb"] == 40.0
    assert ticket["remaining_quota_gb"] == 60.0

    # 5. Check Download History with 6-Hour valid link
    history = await GamesService.get_user_download_history(db=test_db, user_id=user.id)
    assert len(history) == 1
    assert history[0]["game_id"] == game.id
    assert history[0]["is_expired"] is False
    assert history[0]["download_url"] is not None
    assert "sig=" in history[0]["download_url"]

    # 6. Test Stream Direct Endpoint using client fixture
    download_path = ticket["download_url"]

    # 6a. HEAD request without Range -> Expect 200, Content-Length=total_size, Accept-Ranges: bytes
    head_resp = await client.head(download_path)
    assert head_resp.status_code == 200
    assert head_resp.headers.get("accept-ranges") == "bytes"
    assert "attachment" in head_resp.headers.get("content-disposition", "")
    expected_total = int(40.0 * (1024 ** 3))
    assert head_resp.headers.get("content-length") == str(expected_total)

    # 6b. HEAD request WITH Range header (e.g. IDM thread probe bytes=0-1048575)
    head_range_resp = await client.head(download_path, headers={"Range": "bytes=0-1048575"})
    assert head_range_resp.status_code == 206
    assert head_range_resp.headers.get("accept-ranges") == "bytes"
    assert head_range_resp.headers.get("content-length") == "1048576"
    assert head_range_resp.headers.get("content-range") == f"bytes 0-1048575/{expected_total}"

    # 6c. GET request with Range
    get_range_resp = await client.get(download_path, headers={"Range": "bytes=0-1023"})
    assert get_range_resp.status_code == 206
    assert get_range_resp.headers.get("content-range") == f"bytes 0-1023/{expected_total}"
    assert len(get_range_resp.content) == 1024
