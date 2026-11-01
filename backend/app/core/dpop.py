"""DPoP (RFC 9449) and RFC 7638 Cryptographic Engine and Verification.
Provides ES256 key verification, canonical JWK thumbprint calculation,
replay attack prevention via Redis, and DPoP Nonce generation.
"""
import base64
import hashlib
import json
import secrets
import time
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from cryptography.hazmat.primitives.asymmetric.ec import (
    EllipticCurvePublicNumbers,
    SECP256R1,
)
from fastapi import HTTPException, Request, Response, status
import jwt
import redis.asyncio as aioredis


class DPoPException(HTTPException):
    """Base exception for DPoP authentication failures."""
    def __init__(self, status_code: int, detail: str, headers: Optional[Dict[str, str]] = None):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class DPoPNonceException(DPoPException):
    """Raised when client needs to supply or refresh a DPoP Nonce."""
    def __init__(self, fresh_nonce: str):
        headers = {
            "WWW-Authenticate": 'DPoP error="use_dpop_nonce"',
            "DPoP-Nonce": fresh_nonce,
            "Server-Time": str(int(time.time())),
            "Cache-Control": "no-store",
        }
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization failed: invalid or missing DPoP nonce",
            headers=headers,
        )


class OAuthException(Exception):
    """OAuth 2.0 / RFC 8628 error compliant with top-level error and error_description."""
    def __init__(self, status_code: int, error: str, error_description: Optional[str] = None):
        self.status_code = status_code
        self.error = error
        self.error_description = error_description


def b64url_encode(data: bytes) -> str:
    """Encode bytes to base64url without padding."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def b64url_decode(s: str) -> bytes:
    """Decode base64url string with automatic padding."""
    padded = s + "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(padded)


def b64url_to_int(s: str) -> int:
    """Convert base64url string to big-endian integer."""
    return int.from_bytes(b64url_decode(s), byteorder="big")


def int_to_b64url(val: int, length: int = 32) -> str:
    """Convert integer to big-endian bytes of fixed length, then to base64url."""
    b = val.to_bytes((val.bit_length() + 7) // 8 or 1, byteorder="big")
    if len(b) < length:
        b = b.rjust(length, b"\x00")
    return b64url_encode(b)


def compute_jwk_thumbprint(jwk: Dict[str, Any]) -> str:
    """Calculate canonical JWK SHA-256 thumbprint (RFC 7638) for EC P-256 key.
    
    Canonical JSON must contain only required members in lexicographical order:
    {"crv":"P-256","kty":"EC","x":"...","y":"..."}
    """
    if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported key type or curve; only EC P-256 is supported",
        )
    if "d" in jwk:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key parameter 'd' detected in public JWK; request rejected",
        )
    x = jwk.get("x")
    y = jwk.get("y")
    if not x or not y:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing coordinate 'x' or 'y' in EC public JWK",
        )

    canonical = json.dumps(
        {"crv": "P-256", "kty": "EC", "x": x, "y": y},
        separators=(",", ":"),
        sort_keys=True,
    )
    digest = hashlib.sha256(canonical.encode("utf-8")).digest()
    return b64url_encode(digest)


def compute_ath(access_token: str) -> str:
    """Compute RFC 9449 access token hash (ath): base64url(SHA256(access_token))."""
    digest = hashlib.sha256(access_token.encode("ascii")).digest()
    return b64url_encode(digest)


def hash_secret(secret: str) -> str:
    """Compute hex SHA-256 hash for database storage of secrets."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def generate_handoff_secret() -> str:
    """Generate 43-character base64url secret (32 random bytes) for browser handoff."""
    return secrets.token_urlsafe(32)


def generate_device_code() -> str:
    """Generate device code for polling."""
    return f"dpop_dc_{secrets.token_urlsafe(32)}"


def generate_user_code() -> str:
    """Generate user-facing 8-character display code (XXXX-XXXX)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    p1 = "".join(secrets.choice(alphabet) for _ in range(4))
    p2 = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"{p1}-{p2}"


def generate_dpop_access_token() -> str:
    """Generate secure DPoP access token."""
    return f"dpop_at_{secrets.token_urlsafe(32)}"


def generate_dpop_refresh_token() -> str:
    """Generate secure DPoP refresh token."""
    return f"dpop_rt_{secrets.token_urlsafe(32)}"


async def generate_dpop_nonce(redis: aioredis.Redis, ttl: int = 180) -> str:
    """Generate and record a fresh server nonce in Redis with overlapping TTL."""
    nonce = secrets.token_urlsafe(24)
    await redis.set(f"dpop:nonce:{nonce}", "1", ex=ttl)
    return nonce


async def validate_dpop_nonce(redis: aioredis.Redis, nonce: str) -> bool:
    """Check whether nonce exists in Redis."""
    if not nonce:
        return False
    exists = await redis.exists(f"dpop:nonce:{nonce}")
    return bool(exists)


class DPoPProofClaims:
    """Verified DPoP proof claims and metadata."""
    def __init__(
        self,
        jkt: str,
        public_jwk: Dict[str, Any],
        payload: Dict[str, Any],
    ):
        self.jkt = jkt
        self.public_jwk = public_jwk
        self.payload = payload
        self.jti = payload.get("jti", "")
        self.htm = payload.get("htm", "")
        self.htu = payload.get("htu", "")
        self.iat = payload.get("iat", 0)
        self.ath = payload.get("ath")
        self.nonce = payload.get("nonce")


async def verify_dpop_proof(
    dpop_header: Optional[str],
    method: str,
    request_url: str,
    redis: aioredis.Redis,
    access_token: Optional[str] = None,
    required_jkt: Optional[str] = None,
    enforce_nonce: bool = False,
) -> DPoPProofClaims:
    """Mathematically verify a DPoP proof JWT according to RFC 9449 and RFC 7638.
    
    Checks:
    1. Header contains typ='dpop+jwt', alg='ES256', and public jwk.
    2. jwk contains no private key parameters ('d').
    3. Mathematical ECDSA P-256 signature verification.
    4. JKT matches required_jkt (if specified).
    5. Proof claims:
       - jti presence & atomic replay prevention via Redis (TTL 120s).
       - htm matches HTTP method.
       - htu matches normalized public URL or path.
       - iat is within +-120 seconds of server clock.
       - ath matches access_token (if access_token provided).
       - nonce validity against Redis (if present or enforce_nonce is True).
    """
    server_time = int(time.time())
    server_time_str = str(server_time)

    if not dpop_header:
        fresh_nonce = await generate_dpop_nonce(redis)
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing DPoP header",
            headers={"Server-Time": server_time_str, "DPoP-Nonce": fresh_nonce},
        )

    # 1. Inspect unverified header
    try:
        unverified_header = jwt.get_unverified_header(dpop_header)
    except Exception as e:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed DPoP header: {str(e)}",
            headers={"Server-Time": server_time_str},
        )

    typ = unverified_header.get("typ", "").lower()
    if typ != "dpop+jwt":
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid DPoP header typ: '{typ}', expected 'dpop+jwt'",
            headers={"Server-Time": server_time_str},
        )

    alg = unverified_header.get("alg")
    if alg != "ES256":
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported DPoP algorithm: '{alg}', only 'ES256' is supported",
            headers={"Server-Time": server_time_str},
        )

    jwk = unverified_header.get("jwk")
    if not isinstance(jwk, dict):
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'jwk' object in DPoP header",
            headers={"Server-Time": server_time_str},
        )

    if "d" in jwk:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forbidden private key component in DPoP jwk",
            headers={"Server-Time": server_time_str},
        )

    # 2. Compute thumbprint (jkt)
    jkt = compute_jwk_thumbprint(jwk)
    if required_jkt and jkt != required_jkt:
        raise DPoPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DPoP key mismatch: proof key does not match authorization grant key",
            headers={"Server-Time": server_time_str},
        )

    # 3. Construct public key and verify signature
    try:
        x_int = b64url_to_int(jwk["x"])
        y_int = b64url_to_int(jwk["y"])
        pub_key = EllipticCurvePublicNumbers(x_int, y_int, SECP256R1()).public_key()
    except Exception as e:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid EC P-256 public key coordinates: {str(e)}",
            headers={"Server-Time": server_time_str},
        )

    try:
        payload = jwt.decode(
            dpop_header,
            pub_key,
            algorithms=["ES256"],
            options={"verify_signature": True, "verify_exp": False},
        )
    except jwt.PyJWTError as e:
        raise DPoPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"DPoP signature verification failed: {str(e)}",
            headers={"Server-Time": server_time_str},
        )

    # 4. Validate claims
    jti = payload.get("jti")
    if not jti or not isinstance(jti, str) or len(jti.strip()) == 0:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or invalid 'jti' claim in DPoP proof",
            headers={"Server-Time": server_time_str},
        )

    # Method check (htm)
    htm = payload.get("htm", "").upper()
    if htm != method.upper():
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DPoP 'htm' mismatch: expected '{method.upper()}', got '{htm}'",
            headers={"Server-Time": server_time_str},
        )

    # URI check (htu)
    htu = payload.get("htu", "")
    if not htu:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'htu' claim in DPoP proof",
            headers={"Server-Time": server_time_str},
        )

    # Strip query & fragment for comparison
    clean_htu = htu.split("?")[0].split("#")[0].rstrip("/")
    clean_req = request_url.split("?")[0].split("#")[0].rstrip("/")
    
    # Path-level comparison fallback (to support proxying and dltest.gamedr.ir origin)
    htu_path = urlparse(clean_htu).path.rstrip("/")
    req_path = urlparse(clean_req).path.rstrip("/")
    
    # htu matches if exact URI matches OR path matches
    if clean_htu != clean_req and htu_path != req_path:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DPoP 'htu' mismatch: expected path '{req_path}', got '{htu_path}'",
            headers={"Server-Time": server_time_str},
        )

    # Clock skew check (iat)
    iat = payload.get("iat")
    if not isinstance(iat, (int, float)):
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or non-numeric 'iat' claim in DPoP proof",
            headers={"Server-Time": server_time_str},
        )
    if abs(server_time - int(iat)) > 120:
        raise DPoPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DPoP proof timestamp outside acceptable +-120s window (server_time={server_time}, iat={iat})",
            headers={"Server-Time": server_time_str},
        )

    # Access token hash check (ath)
    if access_token:
        expected_ath = compute_ath(access_token)
        actual_ath = payload.get("ath")
        if not actual_ath or actual_ath != expected_ath:
            raise DPoPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="DPoP 'ath' claim missing or mismatch with presented access token",
                headers={"Server-Time": server_time_str},
            )

    # Nonce check
    proof_nonce = payload.get("nonce")
    if enforce_nonce and not proof_nonce:
        fresh_nonce = await generate_dpop_nonce(redis)
        raise DPoPNonceException(fresh_nonce)

    if proof_nonce:
        is_nonce_valid = await validate_dpop_nonce(redis, proof_nonce)
        if not is_nonce_valid:
            fresh_nonce = await generate_dpop_nonce(redis)
            raise DPoPNonceException(fresh_nonce)

    # Replay Prevention in Redis (atomic SETNX with 120s TTL)
    replay_key = f"dpop:replay:{jkt}:{jti}"
    is_new = await redis.set(replay_key, "1", ex=120, nx=True)
    if not is_new:
        raise DPoPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DPoP replay attack detected: 'jti' has already been used",
            headers={"Server-Time": server_time_str},
        )

    return DPoPProofClaims(jkt=jkt, public_jwk=jwk, payload=payload)


def attach_dpop_headers(response: Response, nonce: str) -> None:
    """Attach standard security and synchronization headers to outgoing DPoP response."""
    response.headers["Cache-Control"] = "no-store"
    response.headers["DPoP-Nonce"] = nonce
    response.headers["Server-Time"] = str(int(time.time()))
