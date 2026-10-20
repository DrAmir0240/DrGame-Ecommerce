import pytest


@pytest.mark.asyncio
async def test_register_and_login_flow(client):
    reg_payload = {
        "email": "gamer@drgame.ir",
        "username": "Kratos99",
        "password": "Password123!",
        "display_name": "God of War",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["username"] == "Kratos99"
    assert user_data["profile"]["display_name"] == "God of War"

    # Login
    login_payload = {
        "username_or_email": "Kratos99",
        "password": "Password123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data

    # /auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "Kratos99"
