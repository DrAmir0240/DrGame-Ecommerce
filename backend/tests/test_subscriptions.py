import pytest


@pytest.mark.asyncio
async def test_get_subscription_tiers(client):
    response = await client.get("/api/v1/subscriptions/tiers")
    assert response.status_code == 200
    tiers = response.json()
    assert len(tiers) == 4
    names = [t["name"] for t in tiers]
    assert "Free" in names
    assert "Bronze" in names
    assert "Silver" in names
    assert "Gold" in names


@pytest.mark.asyncio
async def test_quota_status_unauthenticated(client):
    response = await client.get("/api/v1/quota/status")
    assert response.status_code == 200
    data = response.json()
    assert data["has_active_subscription"] is False
    assert data["formatted_pill_text"] == "GB 0"
    assert data["remaining_quota_gb"] == 0.0
