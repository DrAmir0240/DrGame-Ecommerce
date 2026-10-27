"""Unit tests for AuthService: OTP generation, validation, bcrypt hashing, JWT issuance."""
import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.modules.auth.services import AuthService, detect_device_info
from app.modules.auth.schemas import RegisterRequest, PasswordLoginRequest
from app.core.exceptions import AuthenticationError, BadRequestError

@pytest.mark.asyncio
async def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

@pytest.mark.asyncio
async def test_jwt_token_creation_and_decoding():
    token, jti, exp = create_access_token(subject=42, claims={"username": "gamer1"})
    assert isinstance(token, str)
    assert isinstance(jti, str)
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["username"] == "gamer1"
    assert payload["jti"] == jti
    assert payload["type"] == "access"

@pytest.mark.asyncio
async def test_detect_device_info():
    ps5_ua = "Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15"
    name, dev_type = detect_device_info(ps5_ua)
    assert dev_type == "console"
    assert "PlayStation 5" in name

    mobile_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
    name, dev_type = detect_device_info(mobile_ua)
    assert dev_type == "mobile"
    assert "iPhone" in name

    desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
    name, dev_type = detect_device_info(desktop_ua)
    assert dev_type == "desktop"

@pytest.mark.asyncio
async def test_otp_generation_and_verification(fake_redis):
    target = "user@example.com"
    code = await AuthService.generate_and_save_otp(fake_redis, target)
    assert len(code) == 6
    assert code.isdigit()

    # Wrong code should raise BadRequestError
    with pytest.raises(BadRequestError):
        await AuthService.verify_otp(fake_redis, target, "000000")

    # Correct code should pass
    verified = await AuthService.verify_otp(fake_redis, target, code)
    assert verified is True

    # Re-using already verified code should fail (one-time use)
    with pytest.raises(BadRequestError):
        await AuthService.verify_otp(fake_redis, target, code)

@pytest.mark.asyncio
async def test_register_and_login_flow(test_db, fake_redis):
    target = "drgamer@domain.com"
    code = await AuthService.generate_and_save_otp(fake_redis, target)

    req = RegisterRequest(
        target=target,
        code=code,
        full_name="Doctor Gamer",
        username="drgamer",
        password="ValidPassword123"
    )
    client_info = {"device_name": "Chrome on Linux", "device_type": "desktop", "ip_address": "127.0.0.1", "user_agent": "Linux"}
    token_resp = await AuthService.register_user(test_db, fake_redis, req, client_info)

    assert token_resp.access_token is not None
    assert token_resp.user.username == "drgamer"
    assert len(token_resp.user.console_auth_code) == 7

    # Login with valid password
    login_req = PasswordLoginRequest(login="drgamer", password="ValidPassword123")
    login_resp = await AuthService.login_with_password(test_db, login_req, client_info)
    assert login_resp.user.username == "drgamer"

    # Login with console 7-digit code
    console_resp = await AuthService.login_with_console_code(test_db, token_resp.user.console_auth_code, client_info)
    assert console_resp.user.id == token_resp.user.id

    # Console login with bad code should fail
    with pytest.raises(AuthenticationError):
        await AuthService.login_with_console_code(test_db, "BADCODE", client_info)
