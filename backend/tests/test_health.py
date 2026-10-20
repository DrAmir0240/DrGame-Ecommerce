import pytest


@pytest.mark.asyncio
async def test_system_settings_endpoint(client):
    response = await client.get("/api/v1/system/settings")
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "DrGame E-Commerce Platform"
    assert data["default_theme"] == "dark"
    assert "PS5" in data["allowed_platforms"]
    assert data["ten_foot_ui_supported"] is True
