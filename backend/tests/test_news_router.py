"""Integration tests for News & Blog router endpoints."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, create_access_token
from app.modules.users.models import User


@pytest.mark.asyncio
async def test_news_router_endpoints(client: AsyncClient, test_db: AsyncSession):
    # 1. GET /api/blog/categories
    cat_res = await client.get("/api/blog/categories")
    assert cat_res.status_code == 200
    assert len(cat_res.json()) >= 3

    # 2. GET /api/blog/posts
    posts_res = await client.get("/api/blog/posts")
    assert posts_res.status_code == 200
    data = posts_res.json()
    assert "items" in data
    assert data["total"] >= 5

    # 3. GET /api/blog/posts/{slug}
    first_slug = data["items"][0]["slug"]
    detail_res = await client.get(f"/api/blog/posts/{first_slug}")
    assert detail_res.status_code == 200
    post_detail = detail_res.json()
    assert post_detail["slug"] == first_slug
    post_id = post_detail["id"]

    # 4. Auth User for Like
    user = User(
        full_name="Reader Pro",
        username="readerpro",
        password_hash=hash_password("password123"),
        referral_code="READER88",
        console_auth_code="RD12345",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token, jti, exp = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 5. POST /api/blog/posts/{id}/like
    like_res = await client.post(f"/api/blog/posts/{post_id}/like", headers=headers)
    assert like_res.status_code == 200
    assert like_res.json()["current_state"] == "like"
