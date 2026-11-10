"""Automated tests for Cookie-based JWT authentication in DrGame backend."""
import pytest
from app.core.security import create_access_token
from app.modules.users.models import User


@pytest.mark.asyncio
async def test_cookie_auth_login_sets_httponly_cookies(client, test_db):
    """Test that POST /api/auth/login sets Set-Cookie for access_token and refresh_token."""
    user = User(
        id=101,
        full_name="Test User",
        username="testuser",
        email="testuser@example.com",
        phone="09121112233",
        password_hash="hash",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()

    tokens_resp = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": create_access_token(user.id, claims={"type": "refresh"})[0]},
    )
    assert tokens_resp.status_code == 200
    cookies = tokens_resp.cookies
    assert "access_token" in cookies
    assert "refresh_token" in cookies
    body = tokens_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


@pytest.mark.asyncio
async def test_protected_endpoint_accessible_via_cookie(client, test_db):
    """Test accessing a protected endpoint using only cookie without Bearer header."""
    user = User(
        id=102,
        full_name="Cookie User",
        username="cookieuser",
        email="cookieuser@example.com",
        phone="09121112244",
        password_hash="dummy_hash",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()

    access_token, _, _ = create_access_token(user.id)
    client.cookies.set("access_token", access_token)
    resp = await client.get("/api/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == user.id
    assert data["username"] == "cookieuser"


@pytest.mark.asyncio
async def test_logout_clears_cookies(client, test_db):
    """Test that POST /api/auth/logout deletes access_token and refresh_token cookies."""
    user = User(
        id=103,
        full_name="Logout User",
        username="logoutuser",
        email="logoutuser@example.com",
        phone="09121112255",
        password_hash="dummy_hash",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()

    access_token, _, _ = create_access_token(user.id)
    client.cookies.set("access_token", access_token)

    resp = await client.post("/api/auth/logout")
    assert resp.status_code == 200
    set_cookies = resp.headers.get_list("set-cookie") if hasattr(resp.headers, "get_list") else [resp.headers.get("set-cookie", "")]
    cookie_str = " ".join(set_cookies)
    assert "access_token=" in cookie_str
    assert "Max-Age=0" in cookie_str or "expires=" in cookie_str.lower()
