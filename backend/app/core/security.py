import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings


def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes as per bcrypt specification
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        to_encode.update(extra_claims)

    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None
