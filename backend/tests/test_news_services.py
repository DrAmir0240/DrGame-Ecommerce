"""Unit tests for News and Blog services."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.news.models import BlogPost, BlogCategory
from app.modules.news.services import NewsService


@pytest.mark.asyncio
async def test_news_seeding_and_list_posts(test_db: AsyncSession):
    # Seeding triggers automatically on list_posts
    result = await NewsService.list_posts(test_db, category_slug="tutorials")
    assert result["total"] >= 3
    assert len(result["items"]) >= 3
    assert all(item["category_slug"] == "tutorials" for item in result["items"])


@pytest.mark.asyncio
async def test_news_detail_and_view_increment(test_db: AsyncSession):
    detail = await NewsService.get_post_detail(test_db, "ps5-data-transfer-direct-lan")
    assert detail["title_fa"] is not None
    initial_views = detail["views_count"]

    # View again
    detail_2 = await NewsService.get_post_detail(test_db, "ps5-data-transfer-direct-lan")
    assert detail_2["views_count"] == initial_views + 1


@pytest.mark.asyncio
async def test_news_like_dislike_toggle(test_db: AsyncSession):
    # Create test user
    user = User(
        full_name="Gamer One",
        username="gamerone",
        password_hash="pass",
        referral_code="GAMER111",
        console_auth_code="GM12345",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    post = await NewsService.get_post_detail(test_db, "ps4-goldhen-offline-installer")
    post_id = post["id"]
    initial_likes = post["likes_count"]

    # 1. Like the post
    res_like = await NewsService.toggle_interaction(test_db, post_id, user.id, "like")
    assert res_like["current_state"] == "like"
    assert res_like["likes_count"] == initial_likes + 1

    # 2. Like again -> removes like
    res_unlike = await NewsService.toggle_interaction(test_db, post_id, user.id, "like")
    assert res_unlike["current_state"] is None
    assert res_unlike["likes_count"] == initial_likes

    # 3. Dislike
    res_dislike = await NewsService.toggle_interaction(test_db, post_id, user.id, "dislike")
    assert res_dislike["current_state"] == "dislike"
    assert res_dislike["dislikes_count"] == 1
