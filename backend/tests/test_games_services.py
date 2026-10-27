"""Unit tests for GamesService: catalog query, Redis caching, and like/dislike toggle."""
import pytest
from app.modules.games.models import Game
from app.modules.games.services import GamesService

@pytest.mark.asyncio
async def test_games_catalog_and_redis_cache(test_db, fake_redis):
    # Seed sample games
    g1 = Game(
        rawg_id=101,
        title_en="Elden Ring",
        title_fa="الدن رینگ",
        slug="elden-ring",
        rating=4.9,
        download_size_gb=50.0,
        is_two_player=True,
        has_vr=False,
        platforms=["PS5", "PS4"],
        genres=["Action", "RPG"]
    )
    g2 = Game(
        rawg_id=102,
        title_en="Horizon Forbidden West",
        title_fa="هورایزن فوربیدن وست",
        slug="horizon-forbidden-west",
        rating=4.5,
        download_size_gb=85.0,
        is_two_player=False,
        has_vr=True,
        platforms=["PS5"],
        genres=["Action"]
    )
    test_db.add_all([g1, g2])
    await test_db.commit()

    # Query catalog: all
    catalog_all = await GamesService.get_catalog(test_db, fake_redis)
    assert catalog_all.total == 2
    assert len(catalog_all.items) == 2

    # Verify Redis cached the query
    cache_key = GamesService.compute_catalog_cache_key({
        "search": None,
        "genre": None,
        "platform": None,
        "max_size_gb": None,
        "min_rating": None,
        "is_two_player": None,
        "has_vr": None,
        "page": 1,
        "page_size": 20,
    })
    cached_val = await fake_redis.get(cache_key)
    assert cached_val is not None

    # Query with 2-player filter
    catalog_2p = await GamesService.get_catalog(test_db, fake_redis, is_two_player=True)
    assert catalog_2p.total == 1
    assert catalog_2p.items[0].slug == "elden-ring"

@pytest.mark.asyncio
async def test_like_dislike_toggle_behavior(test_db, fake_redis):
    game = Game(
        rawg_id=202,
        title_en="Bloodborne",
        title_fa="بلادبورن",
        slug="bloodborne",
        rating=4.8,
        download_size_gb=35.0,
        likes_count=0,
        dislikes_count=0
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    user_id = 99

    # 1. Like game
    res1 = await GamesService.toggle_like(test_db, fake_redis, game.id, user_id)
    assert res1.likes_count == 1
    assert res1.user_interaction == "like"

    # 2. Like again (toggles off)
    res2 = await GamesService.toggle_like(test_db, fake_redis, game.id, user_id)
    assert res2.likes_count == 0
    assert res2.user_interaction is None

    # 3. Dislike
    res3 = await GamesService.toggle_dislike(test_db, fake_redis, game.id, user_id)
    assert res3.dislikes_count == 1
    assert res3.user_interaction == "dislike"

    # 4. Switch from dislike to like directly
    res4 = await GamesService.toggle_like(test_db, fake_redis, game.id, user_id)
    assert res4.likes_count == 1
    assert res4.dislikes_count == 0
    assert res4.user_interaction == "like"

    # 5. Toggle wishlist
    res_wl = await GamesService.toggle_wishlist(test_db, fake_redis, game.id, user_id)
    assert res_wl.in_wishlist is True
    assert res_wl.wishlist_count == 1

    # Toggle wishlist off
    res_wl2 = await GamesService.toggle_wishlist(test_db, fake_redis, game.id, user_id)
    assert res_wl2.in_wishlist is False
    assert res_wl2.wishlist_count == 0
