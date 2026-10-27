"""Integration tests for Users endpoints: /api/users/*."""
import pytest
from httpx import AsyncClient
from app.core.security import hash_password, create_access_token
from app.modules.users.models import User
from app.modules.auth.models import UserSession

@pytest.mark.asyncio
async def test_users_router_full_cycle(client: AsyncClient, test_db):
    # Setup test user
    user = User(
        full_name="Joel Miller",
        username="joelmiller",
        email="joel@fireflies.org",
        password_hash=hash_password("TheLastOfUs123"),
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token, jti, exp = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /api/users/me
    me_res = await client.get("/api/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "joelmiller"

    # 2. PUT /api/users/profile
    update_res = await client.put(
        "/api/users/profile",
        headers=headers,
        json={"full_name": "Joel Miller Survivor", "avatar_url": "/avatars/sony/joel.png"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Joel Miller Survivor"

    # 3. POST /api/users/change-password
    pw_res = await client.post(
        "/api/users/change-password",
        headers=headers,
        json={"current_password": "TheLastOfUs123", "new_password": "NewSurvivorPassword2026!"}
    )
    assert pw_res.status_code == 200

    # 4. GET /api/users/sessions
    session = UserSession(
        user_id=user.id,
        jti="session-to-revoke-123",
        device_name="PlayStation 5",
        device_type="console",
        is_active=True
    )
    test_db.add(session)
    await test_db.commit()
    await test_db.refresh(session)

    sessions_res = await client.get("/api/users/sessions", headers=headers)
    assert sessions_res.status_code == 200
    assert len(sessions_res.json()) >= 1

    # 5. DELETE /api/users/sessions/{session_id}
    del_res = await client.delete(f"/api/users/sessions/{session.id}", headers=headers)
    assert del_res.status_code == 200
