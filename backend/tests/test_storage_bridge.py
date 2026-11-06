"""Tests for StorageBridgeService, Firmware compatibility engine, and dynamic game downloads."""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token
from app.core.dpop import hash_secret
from app.modules.games.models import Game
from app.modules.games.storage_bridge import (
    detect_console_firmware,
    StorageBridgeService,
)
from app.modules.users.models import User
from app.modules.subscriptions.models import UserSubscription
from app.modules.quota.models import UserQuota
from app.modules.dpop.models import DeviceAuthorization


def test_detect_console_firmware_ps5_low_firmware():
    ua = "Mozilla/5.0 (PlayStation 5/9.00) AppleWebKit/605.1.15 (KHTML, like Gecko)"
    info = detect_console_firmware(ua)
    assert info["platform"] == "ps5"
    assert info["firmware"] == 9.00
    assert info["recommended_format"] == "fpkg"
    assert info["is_console"] is True


def test_detect_console_firmware_ps5_boundary_1140():
    ua = "Mozilla/5.0 (PlayStation 5/11.40) AppleWebKit/605.1.15"
    info = detect_console_firmware(ua)
    assert info["platform"] == "ps5"
    assert info["firmware"] == 11.40
    assert info["recommended_format"] == "fpkg"


def test_detect_console_firmware_ps5_high_firmware():
    ua = "Mozilla/5.0 (PlayStation 5/12.50) AppleWebKit/605.1.15"
    info = detect_console_firmware(ua)
    assert info["platform"] == "ps5"
    assert info["firmware"] == 12.50
    assert info["recommended_format"] == "fat32"
    assert info["is_console"] is True


def test_detect_console_firmware_ps4():
    ua = "Mozilla/5.0 (PlayStation 4 10.01) AppleWebKit/605.1.15"
    info = detect_console_firmware(ua)
    assert info["platform"] == "ps4"
    assert info["recommended_format"] == "fpkg"
    assert info["is_console"] is True


def test_detect_console_firmware_desktop():
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    info = detect_console_firmware(ua)
    assert info["platform"] == "desktop_or_mobile"
    assert info["firmware"] is None
    assert info["recommended_format"] is None
    assert info["is_console"] is False


def test_classify_job_format():
    assert StorageBridgeService.classify_job_format({"download_format": "fpkg"}) == "fpkg"
    assert StorageBridgeService.classify_job_format({"download_format": "pkg"}) == "fpkg"
    assert StorageBridgeService.classify_job_format({"content_format": "fat32"}) == "fat32"
    assert StorageBridgeService.classify_job_format({"display_name": "game_update.zip"}) == "fat32"


def test_normalize_storage_job():
    raw = {
        "id": "job_12345",
        "display_name": "Spider-Man Remastered",
        "content_tag": "ppsa01467",
        "platform": "ps5",
        "download_format": "fpkg",
        "size_bytes": 42949672960,  # 40 GiB
    }
    norm = StorageBridgeService.normalize_storage_job(raw)
    assert norm["job_id"] == "job_12345"
    assert norm["tag"] == "PPSA01467"
    assert norm["format_category"] == "fpkg"
    assert norm["size_gb"] == 40.0
    assert len(norm["sha256"]) == 64


@pytest.mark.asyncio
async def test_get_game_download_options_endpoint(client: AsyncClient, test_db: AsyncSession):
    game = Game(
        source_id="spiderman-123",
        title_en="Marvel's Spider-Man Remastered",
        title_fa="اسپایدرمن ریمسترد",
        slug="marvels-spider-man-remastered",
        ps5_title_id="PPSA01467",
        ps4_title_id="CUSA11995",
        download_size_gb=50.0,
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # Call with PS5 User-Agent (FW 9.00 -> should recommend FPKG)
    headers = {"User-Agent": "PlayStation 5/9.00"}
    res = await client.get(f"/api/games/{game.id}/download-options", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["game_id"] == game.id
    assert data["client_device"]["platform"] == "ps5"
    assert data["client_device"]["firmware"] == 9.0
    assert data["client_device"]["recommended_format"] == "fpkg"
    assert data["ps5_title_id"] == "PPSA01467"
    assert len(data["available_formats"]) >= 2

    # Call with PS5 User-Agent (FW 12.00 -> should recommend FAT32)
    headers_high = {"User-Agent": "PlayStation 5/12.00"}
    res_high = await client.get(f"/api/games/{game.id}/download-options", headers=headers_high)
    assert res_high.status_code == 200
    data_high = res_high.json()
    assert data_high["client_device"]["recommended_format"] == "fat32"


@pytest.mark.asyncio
async def test_sync_storage_jobs_matches_game(client: AsyncClient, test_db: AsyncSession):
    game = Game(
        source_id="batman-999",
        title_en="Batman Arkham Knight",
        title_fa="بتمن آرکام نایت",
        slug="batman-arkham-knight",
        ps5_title_id="PPSA24342",
        download_size_gb=45.0,
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    mock_storage_jobs = [
        {
            "id": "job_batman_fpkg",
            "display_name": "Batman Arkham PS5 FPKG",
            "content_tag": "ppsa24342",
            "platform": "ps5",
            "download_format": "fpkg",
            "content_format": "exfat",
            "size_bytes": 32212254720,  # 30 GiB
        },
        {
            "id": "job_batman_fat32",
            "display_name": "Batman Arkham PS5 FAT32",
            "content_tag": "ppsa24342",
            "platform": "ps5",
            "download_format": "zip",
            "content_format": "fat32",
            "size_bytes": 32212254720,
        },
    ]

    with patch.object(StorageBridgeService, "fetch_storage_jobs", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = [StorageBridgeService.normalize_storage_job(j) for j in mock_storage_jobs]
        sync_res = await StorageBridgeService.sync_game_storage_metadata(db=test_db, game_id=game.id)
        assert sync_res["synced_count"] == 1

        await test_db.refresh(game)
        assert game.storage_sync_status == "ready"
        assert len(game.available_formats) == 2
        categories = [f["format_category"] for f in game.available_formats]
        assert "fpkg" in categories
        assert "fat32" in categories


@pytest.mark.asyncio
async def test_execute_dynamic_handoff_success(client: AsyncClient, test_db: AsyncSession):
    now = datetime.now(timezone.utc)

    # 1. User
    user = User(
        full_name="PS5 Gamer",
        username="ps5gamer",
        password_hash="hashedpass",
        is_active=True,
    )
    test_db.add(user)
    await test_db.flush()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Game
    game = Game(
        source_id="gow-ragnarok",
        title_en="God of War Ragnarok",
        title_fa="خدای جنگ رگناروک",
        slug="god-of-war-ragnarok",
        ps5_title_id="PPSA08330",
        download_size_gb=80.0,
        is_active=True,
    )
    test_db.add(game)

    # 3. Subscription & Quota
    sub = UserSubscription(
        user_id=user.id,
        tier_code="gold",
        status="active",
        start_date=now,
        end_date=now + timedelta(days=30),
    )
    test_db.add(sub)

    quota = UserQuota(
        user_id=user.id,
        total_quota_gb=200.0,
        used_quota_gb=10.0,
        remaining_quota_gb=190.0,
    )
    test_db.add(quota)

    # 4. Device Authorization
    secret = "test_handoff_secret_12345"
    auth = DeviceAuthorization(
        device_code_hash=hash_secret("device_code_123"),
        handoff_secret_hash=hash_secret(secret),
        user_code="USER-CODE",
        jkt="test_jkt_hw_key",
        public_jwk={"kty": "RSA"},
        status="pending",
        expires_at=now + timedelta(minutes=10),
        created_at=now,
    )
    test_db.add(auth)
    await test_db.commit()

    payload = {
        "job_id": f"job_game_{game.id}_fpkg",
        "handoff_secret": secret,
        "selected_format": "fpkg",
    }

    res = await client.post(
        f"/api/games/{game.id}/handoff",
        json=payload,
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["format_category"] == "fpkg"

    # Check quota deducted
    await test_db.refresh(quota)
    assert quota.remaining_quota_gb < 190.0

    # Check device authorization approved
    await test_db.refresh(auth)
    assert auth.status == "approved"
    assert auth.user_id == user.id
    assert auth.job_id == f"job_game_{game.id}_fpkg"
