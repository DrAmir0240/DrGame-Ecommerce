"""Integration tests for Quota router endpoints: /api/quota/*."""
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.modules.users.models import User
from app.modules.quota.services import QuotaService

@pytest.mark.asyncio
async def test_quota_router_flow(client: AsyncClient, test_db, fake_redis):
    user = User(
        full_name="Quota Gamer",
        username="quotagamer",
        password_hash="hashedpass",
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Charge 100 GB directly
    await QuotaService.charge_user_quota(test_db, fake_redis, user.id, 100.0)

    # 2. GET /api/quota/me
    me_quota_res = await client.get("/api/quota/me", headers=headers)
    assert me_quota_res.status_code == 200
    assert me_quota_res.json()["total_quota_gb"] == 100.0
    assert me_quota_res.json()["remaining_quota_gb"] == 100.0

    # 3. POST /api/quota/callback/consume with valid signature
    bytes_downloaded = int(15 * (1024 ** 3))  # 15 GB
    server_id = "edge-node-tehran-3"
    valid_sig = QuotaService.generate_webhook_signature(user.id, 999, bytes_downloaded, server_id)

    cb_res = await client.post("/api/quota/callback/consume", json={
        "user_id": user.id,
        "game_id": 999,
        "bytes_downloaded": bytes_downloaded,
        "download_server_id": server_id,
        "signature": valid_sig
    })
    assert cb_res.status_code == 200
    assert round(cb_res.json()["gb_deducted"]) == 15
    assert round(cb_res.json()["remaining_quota_gb"]) == 85

    # 4. Check /api/quota/me reflects consumed quota
    me_after = await client.get("/api/quota/me", headers=headers)
    assert round(me_after.json()["remaining_quota_gb"]) == 85
    assert round(me_after.json()["used_quota_gb"]) == 15
