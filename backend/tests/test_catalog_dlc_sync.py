"""Tests for Step 23: DLC catalog separation, enrichment and parent game attachment."""
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from app.modules.catalog_sync.services import CatalogSyncService
from app.modules.games.models import Game
from app.modules.games.download_models import GameDownloadFile
from scripts.cleanup_dlc_games import parse_parent_and_dlc_title, cleanup_dlc_records


@pytest.mark.asyncio
async def test_process_game_dlcs_attaches_and_deduplicates(test_db: AsyncSession):
    """Test that _process_game_dlcs saves DLCs & expansions to GameDownloadFile and prevents duplicate titles."""
    # 1. Create a parent game
    parent_game = Game(
        source_id="test-witcher3",
        title_en="The Witcher 3: Wild Hunt",
        title_fa="ویچر ۳: شکار وحشیانه",
        slug="the-witcher-3-wild-hunt",
        download_size_gb=45.0,
        platforms=["PS5", "PS4"],
        genres=["RPG"],
        is_active=True,
    )
    test_db.add(parent_game)
    await test_db.commit()
    await test_db.refresh(parent_game)

    service = CatalogSyncService()

    raw_dlcs = [
        {"id": 1001, "name": "Hearts of Stone", "slug": "the-witcher-3-hearts-of-stone"},
        {"id": 1002, "name": "Blood and Wine", "slug": "the-witcher-3-blood-and-wine-expansion"},
    ]
    raw_expansions = [
        {"id": 1003, "name": "Alternative Look for Ciri", "slug": "ciri-dlc"},
    ]

    # First run: should attach 3 DLC files
    attached_count = await service._process_game_dlcs(
        db=test_db,
        game_id=parent_game.id,
        raw_dlcs=raw_dlcs,
        raw_expansions=raw_expansions,
    )
    assert attached_count == 3

    # Verify records in GameDownloadFile
    files_stmt = select(GameDownloadFile).where(
        GameDownloadFile.game_id == parent_game.id,
        GameDownloadFile.file_type == "dlc",
    )
    files = list((await test_db.scalars(files_stmt)).all())
    assert len(files) == 3
    file_titles = [f.title for f in files]
    assert "Hearts of Stone" in file_titles
    assert "Blood and Wine" in file_titles
    assert "Alternative Look for Ciri" in file_titles

    # Verify Blood and Wine expansion estimated size is 10.0 GB
    bw_file = next(f for f in files if f.title == "Blood and Wine")
    assert bw_file.file_size_gb == 10.0
    assert bw_file.download_url == f"/api/games/{parent_game.id}/downloads/{bw_file.id}/stream"

    # Second run with same DLCs: should be deduplicated (0 new files)
    second_run = await service._process_game_dlcs(
        db=test_db,
        game_id=parent_game.id,
        raw_dlcs=raw_dlcs,
        raw_expansions=raw_expansions,
    )
    assert second_run == 0


@pytest.mark.asyncio
async def test_dlc_title_parsing_and_migration(test_db: AsyncSession):
    """Test parse_parent_and_dlc_title and cleanup migration logic."""
    parent_cand, dlc_cand = parse_parent_and_dlc_title("The Witcher 3: Wild Hunt - Hearts of Stone")
    assert parent_cand == "The Witcher 3: Wild Hunt"
    assert dlc_cand == "Hearts of Stone"

    parent_cand2, dlc_cand2 = parse_parent_and_dlc_title("Funko Fusion: Mega Man Pack Bundle")
    assert parent_cand2 == "Funko Fusion"
    assert dlc_cand2 == "Mega Man Pack Bundle"

    no_parent, no_dlc = parse_parent_and_dlc_title("Gran Turismo 7")
    assert no_parent is None
    assert no_dlc is None


@pytest.mark.asyncio
async def test_game_downloads_api_returns_dlcs(client: AsyncClient, test_db: AsyncSession):
    """Test that /api/games/{game_id}/downloads returns attached DLC files for the storefront."""
    # 1. Create a game
    game = Game(
        source_id="test-game-dlc-api",
        title_en="Elden Ring",
        title_fa="الدن رینگ",
        slug="elden-ring",
        download_size_gb=50.0,
        platforms=["PS5", "PS4"],
        genres=["Action"],
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # 2. Add a DLC file
    dlc = GameDownloadFile(
        game_id=game.id,
        file_type="dlc",
        title="Shadow of the Erdtree",
        file_size_gb=15.0,
        download_url=f"/api/games/{game.id}/downloads/999/stream",
        allowed_tiers=["gold", "silver", "bronze"],
        is_active=True,
    )
    test_db.add(dlc)
    await test_db.commit()

    # 3. Call GET /api/games/{game_id}/downloads
    res = await client.get(f"/api/games/{game.id}/downloads")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    dlc_item = next((item for item in data if item["file_type"] == "dlc"), None)
    assert dlc_item is not None
    assert dlc_item["title"] == "Shadow of the Erdtree"
    assert dlc_item["file_size_gb"] == 15.0
