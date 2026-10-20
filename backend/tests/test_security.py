import pytest
from app.core.security import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing():
    raw_pass = "MySuperSecretPS5Pass123"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    user_id = 42
    token = create_access_token(subject=user_id, extra_claims={"gamer_tag": "DrGamer99"})
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["gamer_tag"] == "DrGamer99"
