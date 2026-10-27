"""Unit tests for catalog seeder logic, 5-part download generator, and GeoIP detection."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile
from app.modules.core.geoip_service import GeoIPService, is_private_or_loopback
from scripts.seed_300_games import (
    generate_download_files_for_game,
    ensure_download_files_exist,
    BACKUP_PLAYSTATION_GAMES,
)

def test_generate_5_download_files_structure():
    game = Game(
        id=42,
        rawg_id=12345,
        title_en="Demon's Souls",
        title_fa="Demon's Souls",
        slug="demons-souls",
        download_size_gb=40.0,
    )
    files = generate_download_files_for_game(game)
    assert len(files) == 5

    file_types = {f.file_type for f in files}
    assert file_types == {"data", "cheat", "dlc", "subtitle", "dubbing"}

    data_file = next(f for f in files if f.file_type == "data")
    assert data_file.file_size_gb == 40.0
    assert "free" in data_file.allowed_tiers
    assert "https://dl.drgame.ir/storage/demons-souls/data.pkg" == data_file.download_url

    cheat_file = next(f for f in files if f.file_type == "cheat")
    assert cheat_file.file_size_gb == 0.1
    assert "gold" in cheat_file.allowed_tiers

    dlc_file = next(f for f in files if f.file_type == "dlc")
    assert dlc_file.file_size_gb == 12.0  # 40 * 0.3

    sub_file = next(f for f in files if f.file_type == "subtitle")
    assert sub_file.file_size_gb == 0.2

    dub_file = next(f for f in files if f.file_type == "dubbing")
    assert dub_file.file_size_gb == 1.5

@pytest.mark.asyncio
async def test_ensure_download_files_exist_in_db(test_db: AsyncSession):
    game = Game(
        rawg_id=77777,
        title_fa="Bloodborne",
        title_en="Bloodborne",
        slug="bloodborne",
        download_size_gb=35.0,
        platforms=["PS4"],
        genres=["Action", "RPG"],
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # First run should create 5 files
    created_count = await ensure_download_files_exist(test_db, game)
    assert created_count == 5
    await test_db.commit()

    # Verify files in DB
    stmt = select(GameDownloadFile).where(GameDownloadFile.game_id == game.id)
    records = (await test_db.execute(stmt)).scalars().all()
    assert len(records) == 5

    # Second run should be idempotent (return 0)
    second_run = await ensure_download_files_exist(test_db, game)
    assert second_run == 0

def test_backup_playstation_games_catalog_integrity():
    assert len(BACKUP_PLAYSTATION_GAMES) >= 15
    for item in BACKUP_PLAYSTATION_GAMES:
        assert "name" in item
        assert "slug" in item
        assert "rawg_id" in item
        assert item["metacritic"] >= 80

@pytest.mark.asyncio
async def test_geoip_service_local_and_private_ip():
    assert is_private_or_loopback("127.0.0.1") is True
    assert is_private_or_loopback("192.168.1.100") is True
    assert is_private_or_loopback("10.0.0.5") is True
    assert is_private_or_loopback("8.8.8.8") is False

    res = await GeoIPService.get_country_by_ip("127.0.0.1")
    assert res.country_code == "IR"
    assert res.suggested_lang == "fa"
    assert res.direction == "rtl"
    assert res.is_local is True
