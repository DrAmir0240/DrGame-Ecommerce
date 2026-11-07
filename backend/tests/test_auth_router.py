"""Integration tests for Auth endpoints: /api/auth/*."""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_full_journey_via_api(client: AsyncClient):
    # In domestic mode, target must be phone number
    target = "09121112233"

    # 1. Request OTP (should detect unregistered target)
    otp_res = await client.post("/api/auth/otp/send", json={"target": target})
    assert otp_res.status_code == 200
    otp_json = otp_res.json()
    assert "detail" in otp_json
    assert otp_json["is_registered"] is False
    code = otp_json["detail"].replace("DEBUG_CODE: ", "").strip()

    # 2. Register
    reg_payload = {
        "target": target,
        "code": code,
        "full_name": "Pro Player",
        "username": "proplayer",
        "password": "StrongPassword2026!"
    }
    reg_res = await client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    access_token = reg_data["access_token"]
    refresh_token = reg_data["refresh_token"]
    console_code = reg_data["user"]["console_auth_code"]
    assert len(console_code) == 7

    # 3. Duplicate registration should return 400 or 409
    dup_res = await client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code in (400, 409)

    # 4. Password login
    login_res = await client.post("/api/auth/login", json={
        "login": "proplayer",
        "password": "StrongPassword2026!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 5. Bad password returns 401
    bad_login_res = await client.post("/api/auth/login", json={
        "login": "proplayer",
        "password": "WrongPassword!"
    })
    assert bad_login_res.status_code == 401

    # 5b. Request OTP for already registered user (should detect is_registered=True)
    otp_registered_res = await client.post("/api/auth/otp/send", json={"target": target})
    assert otp_registered_res.status_code == 200
    assert otp_registered_res.json()["is_registered"] is True

    # 6. Console login with 7-digit code
    console_res = await client.post("/api/auth/login/console", json={
        "console_code": console_code
    })
    assert console_res.status_code == 200
    assert console_res.json()["user"]["username"] == "proplayer"

    # 7. Refresh token
    ref_res = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()

    # 8. Logout
    logout_res = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert logout_res.status_code == 200

    # 9. Verify blacklisted token cannot access protected /api/users/me
    me_res = await client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_res.status_code == 401

    # 10. Dynamic Console Pairing Code flow
    # Re-login with password
    rel_res = await client.post("/api/auth/login", json={"login": "proplayer", "password": "StrongPassword2026!"})
    new_token = rel_res.json()["access_token"]

    gen_res = await client.post("/api/users/console-code/generate", headers={"Authorization": f"Bearer {new_token}"})
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert "code" in gen_data
    assert len(gen_data["code"]) == 6
    assert gen_data["expires_in"] == 120

    # Test login with this dynamic code on console
    pair_res = await client.post("/api/auth/login/console", json={"console_code": gen_data["code"]})
    assert pair_res.status_code == 200
    assert pair_res.json()["user"]["username"] == "proplayer"
    assert me_res.status_code == 401


@pytest.mark.asyncio
async def test_register_with_referral_code_binds_chain(client: AsyncClient):
    # 1. Register referrer
    ref_target = "09129876543"
    otp1 = await client.post("/api/auth/otp/send", json={"target": ref_target})
    code1 = otp1.json()["detail"].replace("DEBUG_CODE: ", "").strip()

    res1 = await client.post("/api/auth/register", json={
        "target": ref_target,
        "code": code1,
        "full_name": "Upline User",
        "username": "upline_user",
        "password": "Password12345!"
    })
    assert res1.status_code == 201
    referrer_code = res1.json()["user"]["referral_code"]
    referrer_token = res1.json()["access_token"]

    # 2. Register downline passing referrer_code
    down_target = "09121234567"
    otp2 = await client.post("/api/auth/otp/send", json={"target": down_target})
    code2 = otp2.json()["detail"].replace("DEBUG_CODE: ", "").strip()

    res2 = await client.post("/api/auth/register", json={
        "target": down_target,
        "code": code2,
        "full_name": "Downline User",
        "username": "downline_user",
        "password": "Password12345!",
        "referral_code": referrer_code
    })
    assert res2.status_code == 201

    # 3. Verify referrer's network tree now has 1 member
    tree_res = await client.get("/api/referral/network-tree", headers={"Authorization": f"Bearer {referrer_token}"})
    assert tree_res.status_code == 200
    assert tree_res.json()["total_members"] == 1
    assert len(tree_res.json()["levels"]) == 1
    assert tree_res.json()["levels"][0]["level"] == 1
    assert tree_res.json()["levels"][0]["members_count"] == 1

