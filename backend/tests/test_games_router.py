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


@pytest.mark.asyncio
async def test_game_download_ticket_and_stream(client: AsyncClient, test_db):
    """
    Test Step 20/21: Download ticket issuance, atomic quota deduction,
    UserDownloadHistory audit logging, strict NO free re-download policy,
    and direct streaming with signed token.
    """
    from datetime import datetime, timedelta, timezone
    from app.modules.subscriptions.models import UserSubscription
    from app.modules.quota.models import UserQuota
    from app.modules.games.download_models import UserDownloadHistory
    from sqlalchemy import select

    # 1. Setup User
    user = User(
        full_name="Downloader Pro",
        username="dl_pro",
        password_hash="pass123",
        is_active=True
    )
    test_db.add(user)
    await test_db.flush()

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup Game (size 40 GB)
    game = Game(
        rawg_id=999,
        title_en="Elden Ring",
        title_fa="الدن رینگ",
        slug="elden-ring",
        rating=4.9,
        download_size_gb=40.0,
        platforms=["PS5"],
        genres=["RPG"],
        is_active=True,
    )
    test_db.add(game)
    await test_db.commit()
    await test_db.refresh(game)

    # 3. Request ticket without subscription -> MUST FAIL with 403 Forbidden
    ticket_req = {"format_category": "fpkg"}
    fail_res = await client.post(f"/api/games/{game.id}/download-ticket", json=ticket_req, headers=headers)
    assert fail_res.status_code == 403

    # 4. Give user active Gold subscription and 100 GB quota
    now = datetime.now(timezone.utc)
    sub = UserSubscription(
        user_id=user.id,
        tier_code="gold",
        start_date=now,
        end_date=now + timedelta(days=30),
        status="active",
    )
    quota = UserQuota(
        user_id=user.id,
        total_quota_gb=100.0,
        used_quota_gb=0.0,
        remaining_quota_gb=100.0,
    )
    test_db.add_all([sub, quota])
    await test_db.commit()

    # 5. Request ticket with active subscription -> MUST SUCCEED
    ticket_res = await client.post(f"/api/games/{game.id}/download-ticket", json=ticket_req, headers=headers)
    assert ticket_res.status_code == 200
    ticket_data = ticket_res.json()
    assert ticket_data["status"] == "success"
    assert ticket_data["file_size_gb"] == 40.0
    assert ticket_data["remaining_quota_gb"] == 60.0
    assert "download-stream" in ticket_data["download_url"]

    # Verify quota updated in DB
    refreshed_q = await test_db.scalar(select(UserQuota).where(UserQuota.user_id == user.id))
    assert refreshed_q.used_quota_gb == 40.0
    assert refreshed_q.remaining_quota_gb == 60.0

    # Verify UserDownloadHistory record exists
    hist = (await test_db.execute(select(UserDownloadHistory).where(UserDownloadHistory.user_id == user.id))).scalars().all()
    assert len(hist) == 1
    assert hist[0].file_size_gb == 40.0
    assert "Elden Ring" in hist[0].file_title

    # 6. Test GET download-stream with signed URL returned
    stream_url = ticket_data["download_url"]
    stream_res = await client.get(stream_url)
    assert stream_res.status_code == 200
    assert "attachment" in stream_res.headers.get("content-disposition", "")
    assert stream_res.headers.get("accept-ranges") == "bytes"

    # 7. Strict NO free re-download rule:
    # A second ticket request for the same game MUST deduct another 40.0 GB!
    ticket_res2 = await client.post(f"/api/games/{game.id}/download-ticket", json=ticket_req, headers=headers)
    assert ticket_res2.status_code == 200
    ticket_data2 = ticket_res2.json()
    assert ticket_data2["remaining_quota_gb"] == 20.0

    hist2 = (await test_db.execute(select(UserDownloadHistory).where(UserDownloadHistory.user_id == user.id))).scalars().all()
    assert len(hist2) == 2

    # 8. Third request requires 40.0 GB but only 20.0 GB remains -> MUST FAIL with 400 Bad Request
    fail_quota_res = await client.post(f"/api/games/{game.id}/download-ticket", json=ticket_req, headers=headers)
    assert fail_quota_res.status_code == 400
    res_data = fail_quota_res.json()
    error_msg = res_data.get("message") or res_data.get("detail", "")
    assert "کافی نیست" in error_msg

