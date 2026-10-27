"""Tests for similar games, free tier games summary, and genres management."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.modules.games.models import Game, Genre
from app.modules.subscriptions.models import FreeTierAllowedGame


@pytest.mark.asyncio
async def test_similar_games_and_genres(test_db: AsyncSession, client: AsyncClient):
    """Test similar games endpoint and genres API."""
    # 1. Create 3 games with overlapping genres
    g1 = Game(
        rawg_id=8801,
        title_fa="بازی اکشن یک",
        title_en="Action Game One",
        slug="action-game-one",
        genres=["Action", "Adventure"],
        likes_count=100,
        rating=4.8,
        download_size_gb=45.0,
    )
    g2 = Game(
        rawg_id=8802,
        title_fa="بازی اکشن دو",
        title_en="Action Game Two",
        slug="action-game-two",
        genres=["Action", "Shooter"],
        likes_count=200,
        rating=4.9,
        download_size_gb=50.0,
    )
    g3 = Game(
        rawg_id=8803,
        title_fa="بازی معمایی سه",
        title_en="Puzzle Game Three",
        slug="puzzle-game-three",
        genres=["Puzzle"],
        likes_count=10,
        rating=4.0,
        download_size_gb=10.0,
    )
    test_db.add_all([g1, g2, g3])
    await test_db.flush()

    # 1. Check similar games for g1
    res = await client.get(f"/api/games/{g1.id}/similar")
    assert res.status_code == 200
    similar = res.json()
    assert len(similar) >= 1
    # g2 shares "Action" and has highest likes, so it should be first
    assert similar[0]["id"] == g2.id
    # g1 should not be in its own similar games
    assert not any(s["id"] == g1.id for s in similar)

    # 2. Check free tier games endpoint
    ft_res = await client.get("/api/subscriptions/free-tier-games")
    assert ft_res.status_code == 200
    ft_games = ft_res.json()
    assert isinstance(ft_games, list)
    if len(ft_games) > 0:
        first_fg = ft_games[0]
        assert "title_fa" in first_fg
        assert "platforms" in first_fg
        assert "release_year" in first_fg

    # 3. Check public genres list
    gen_res = await client.get("/api/genres")
    assert gen_res.status_code == 200
    assert isinstance(gen_res.json(), list)
