"""Integration tests for Games router: /api/games/*."""
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.modules.games.models import Game, Genre
from app.modules.users.models import User

@pytest.mark.asyncio
async def test_games_router_endpoints(client: AsyncClient, test_db):
    # Setup test user and token
    user = User(
        full_name="Gamer Tester",
        username="gamertest",
        password_hash="hashedpass",
        is_active=True
    )
    test_db.add(user)
    await test_db.flush()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup genres and game
    genre = Genre(rawg_id=1, name_fa="اکشن", name_en="Action", slug="action")
    game = Game(
        rawg_id=777,
        title_en="Demon's Souls",
        title_fa="دیمنز سولز",
        slug="demons-souls",
        rating=4.7,
        download_size_gb=66.0,
        platforms=["PS5"],
        genres=["Action"]
    )
    test_db.add_all([genre, game])
    await test_db.commit()
    await test_db.refresh(game)

    # 1. GET /api/games
    list_res = await client.get("/api/games")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert data["items"][0]["slug"] == "demons-souls"

    # 2. GET /api/games/genres/list
    genres_res = await client.get("/api/games/genres/list")
    assert genres_res.status_code == 200
    assert len(genres_res.json()) >= 1
    assert genres_res.json()[0]["slug"] == "action"

    # 3. GET /api/games/{id}
    detail_res = await client.get(f"/api/games/{game.id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["title_en"] == "Demon's Souls"

    # 4. POST /api/games/{id}/like
    like_res = await client.post(f"/api/games/{game.id}/like", headers=headers)
    assert like_res.status_code == 200
    assert like_res.json()["likes_count"] == 1
    assert like_res.json()["user_interaction"] == "like"

    # 5. POST /api/games/{id}/dislike
    dislike_res = await client.post(f"/api/games/{game.id}/dislike", headers=headers)
    assert dislike_res.status_code == 200
    assert dislike_res.json()["likes_count"] == 0
    assert dislike_res.json()["dislikes_count"] == 1

    # 6. POST /api/games/{id}/wishlist
    wl_res = await client.post(f"/api/games/{game.id}/wishlist", headers=headers)
    assert wl_res.status_code == 200
    assert wl_res.json()["in_wishlist"] is True
