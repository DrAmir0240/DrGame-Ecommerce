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
    # In domestic mode (default), target must be Iranian phone
    phone_target = "09123456789"
    code = await AuthService.generate_and_save_otp(fake_redis, phone_target)
    assert len(code) == 6
    assert code.isdigit()

    # Email in domestic mode should be rejected
    with pytest.raises(BadRequestError):
        await AuthService.generate_and_save_otp(fake_redis, "user@example.com")

    # Wrong code should raise BadRequestError
    with pytest.raises(BadRequestError):
        await AuthService.verify_otp(fake_redis, phone_target, "000000")

    # Correct code should pass
    verified = await AuthService.verify_otp(fake_redis, phone_target, code)
    assert verified is True

    # Re-using already verified code should fail (one-time use)
    with pytest.raises(BadRequestError):
        await AuthService.verify_otp(fake_redis, phone_target, code)

@pytest.mark.asyncio
async def test_register_and_login_flow(test_db, fake_redis):
    target = "09129876543"
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

    # Login with console fallback 7-digit code
    console_resp = await AuthService.login_with_console_code(test_db, fake_redis, token_resp.user.console_auth_code, client_info)
    assert console_resp.user.id == token_resp.user.id

    # Test dynamic 2-minute pairing code
    from app.modules.users.services import UserService
    dynamic_code_data = await UserService.generate_dynamic_console_code(fake_redis, token_resp.user.id)
    assert len(dynamic_code_data["code"]) == 6
    assert dynamic_code_data["expires_in"] == 120

    # Login with dynamic code
    dyn_login_resp = await AuthService.login_with_console_code(test_db, fake_redis, dynamic_code_data["code"], client_info)
    assert dyn_login_resp.user.id == token_resp.user.id

    # Dynamic code should be consumed and fail on second attempt
    with pytest.raises(AuthenticationError):
        await AuthService.login_with_console_code(test_db, fake_redis, dynamic_code_data["code"], client_info)

    # Console login with bad code should fail
    with pytest.raises(AuthenticationError):
        await AuthService.login_with_console_code(test_db, fake_redis, "BADCODE", client_info)


@pytest.mark.asyncio
async def test_international_mode_registration(test_db, fake_redis, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "DEPLOYMENT_MODE", "international")
    monkeypatch.setattr(settings, "DEFAULT_CURRENCY", "USDT")

    from app.core.exceptions import BadRequestError

    # In international mode, phone number should fail
    with pytest.raises(BadRequestError, match="ارسال کد فقط به آدرس ایمیل"):
        await AuthService.generate_and_save_otp(fake_redis, "09121112233")

    # Valid international email should succeed
    email_target = "globalgamer@domain.com"
    code = await AuthService.generate_and_save_otp(fake_redis, email_target)
    assert len(code) == 6

    req = RegisterRequest(
        target=email_target,
        code=code,
        full_name="Global Champion",
        username="globalchamp",
        password="SecurePass2026!",
    )
    client_info = {"device_name": "Chrome on Mac", "device_type": "desktop", "ip_address": "1.1.1.1", "user_agent": "Macintosh"}
    token_resp = await AuthService.register_user(test_db, fake_redis, req, client_info)

    assert token_resp.user.email == email_target
    assert token_resp.user.username == "globalchamp"

    # Verify wallet currency was initialized to USDT
    from app.modules.wallet.models import UserWallet
    from sqlalchemy import select
    wallet = await test_db.scalar(select(UserWallet).where(UserWallet.user_id == token_resp.user.id))
    assert wallet is not None
    assert wallet.currency == "USDT"
