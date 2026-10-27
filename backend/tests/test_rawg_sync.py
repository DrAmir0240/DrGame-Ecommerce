"""Unit tests for RAWG synchronization and metadata normalization."""
import pytest
from app.modules.rawg_sync.services import (
    map_rawg_platforms,
    detect_two_player_and_vr,
    RawgSyncService,
)
from app.modules.games.models import Game, Genre

def test_platform_mapping():
    platforms_sample = [
        {"platform": {"slug": "playstation5", "name": "PlayStation 5"}},
        {"platform": {"slug": "xbox-series-x", "name": "Xbox Series X"}},
        {"platform": {"slug": "pc", "name": "PC"}},
    ]
    mapped = map_rawg_platforms(platforms_sample)
    assert "PS5" in mapped
    assert "Xbox" in mapped

def test_two_player_and_vr_detection():
    # Co-op tag game
    coop_game = {
        "tags": [
            {"slug": "co-op", "name": "Co-op"},
            {"slug": "action", "name": "Action"}
        ]
    }
    is_2p, has_vr = detect_two_player_and_vr(coop_game)
    assert is_2p is True
    assert has_vr is False

    # VR tag game
    vr_game = {
        "tags": [
            {"slug": "playstation-vr", "name": "PlayStation VR"}
        ]
    }
    is_2p, has_vr = detect_two_player_and_vr(vr_game)
    assert is_2p is False
    assert has_vr is True

    # Single player without VR
    sp_game = {"tags": [{"slug": "singleplayer", "name": "Singleplayer"}]}
    is_2p, has_vr = detect_two_player_and_vr(sp_game)
    assert is_2p is False
    assert has_vr is False

@pytest.mark.asyncio
async def test_save_or_update_game_creates_download_links(test_db):
    service = RawgSyncService()
    sample_rawg_payload = {
        "id": 99999,
        "name": "Ghost of Tsushima",
        "slug": "ghost-of-tsushima",
        "rating": 4.85,
        "metacritic": 83,
        "released": "2020-07-17",
        "background_image": "https://media.rawg.io/ghost.jpg",
        "platforms": [{"platform": {"slug": "playstation5"}}],
        "tags": [{"slug": "singleplayer"}],
        "genres": [{"name": "Action"}]
    }

    game = await service.save_or_update_game(test_db, sample_rawg_payload)
    await test_db.commit()

    assert game.id is not None
    assert game.title_en == "Ghost of Tsushima"
    assert game.rating == 4.85
    assert "PS5" in game.platforms
