"""Core security utilities: Bcrypt password hashing and JWT token handling."""
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
import bcrypt
import jwt
from app.core.config import settings
from app.core.exceptions import AuthenticationError

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def create_access_token(
    subject: str | int,
    claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None
) -> tuple[str, str, datetime]:
    """
    Create JWT access token.
    Returns (token_string, jti, expires_at).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = str(uuid.uuid4())
    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "jti": jti,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if claims:
        to_encode.update(claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt, jti, expire

def create_refresh_token(
    subject: str | int,
    expires_delta: timedelta | None = None
) -> tuple[str, str, datetime]:
    """
    Create JWT refresh token (7 days default).
    Returns (token_string, jti, expires_at).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    
    jti = str(uuid.uuid4())
    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "jti": jti,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt, jti, expire

def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT token signature and expiration."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("توکن احراز هویت منقضی شده است.")
    except jwt.InvalidTokenError:
        raise AuthenticationError("توکن نامعتبر است.")
