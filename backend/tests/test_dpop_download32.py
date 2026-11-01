"""Unit and integration tests for PS5 Download32 & DPoP protocol."""
import base64
import hashlib
import json
import secrets
import time
from typing import Dict, Tuple

import pytest
import pytest_asyncio
from cryptography.hazmat.primitives.asymmetric import ec
from httpx import AsyncClient
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dpop import (
    b64url_encode,
    compute_ath,
    compute_jwk_thumbprint,
    generate_device_code,
    generate_handoff_secret,
    hash_secret,
    int_to_b64url,
)
from app.core.security import create_access_token
from app.modules.dpop.models import DeviceAuthorization, DeviceGrant, DeviceStorageReport, RegisteredDevice
from app.modules.games.download_models import GameDownloadFile
from app.modules.users.models import User


def generate_test_ec_key() -> Tuple[ec.EllipticCurvePrivateKey, Dict[str, str]]:
    """Generate EC P-256 key pair and return private key and public JWK dictionary."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_numbers = private_key.public_key().public_numbers()
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "x": int_to_b64url(public_numbers.x),
        "y": int_to_b64url(public_numbers.y),
    }
    return private_key, jwk


def create_dpop_proof(
    private_key: ec.EllipticCurvePrivateKey,
    public_jwk: Dict[str, str],
    method: str,
    url: str,
    access_token: str | None = None,
    nonce: str | None = None,
    jti: str | None = None,
    iat: int | None = None,
) -> str:
    """Create a signed DPoP proof JWT with ES256."""
    headers = {
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": public_jwk,
    }
    payload = {
        "jti": jti or secrets.token_urlsafe(16),
        "htm": method.upper(),
        "htu": url.split("?")[0].split("#")[0],
        "iat": iat if iat is not None else int(time.time()),
    }
    if access_token:
        payload["ath"] = compute_ath(access_token)
    if nonce:
        payload["nonce"] = nonce

    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)


@pytest_asyncio.fixture
async def authenticated_user(test_db: AsyncSession) -> Tuple[User, str]:
    """Create test user and return User object and JWT access token."""
    user = User(
        full_name="PS5 Test Gamer",
        username="ps5_gamer",
        email="ps5@drgame.ir",
        phone="09123456789",
        password_hash="hashed_pw_test",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    token_str, _, _ = create_access_token(subject=user.id, claims={"username": user.username})
    return user, token_str


@pytest_asyncio.fixture
async def sample_game_file(test_db: AsyncSession) -> GameDownloadFile:
    """Create a sample GameDownloadFile for downloading."""
    game_file = GameDownloadFile(
        id=101,
        game_id=42,
        file_type="data",
        title="God of War Ragnarok Part 1",
        file_size_gb=10.0,
        size_bytes=10737418240,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        download_url="https://dltest.gamedr.ir/storage/gow_p1.pkg",
        is_active=True,
    )
    test_db.add(game_file)
    await test_db.commit()
    await test_db.refresh(game_file)
    return game_file


@pytest.mark.asyncio
async def test_dpop_cryptographic_helpers():
    """Verify RFC 7638 thumbprint, ath, and private key parameter rejection."""
    priv_key, jwk = generate_test_ec_key()
    jkt = compute_jwk_thumbprint(jwk)
    assert len(jkt) > 20

    # Ensure rejection if private key 'd' is present
    dirty_jwk = dict(jwk)
    dirty_jwk["d"] = "secret_d_should_never_be_here"
    with pytest.raises(Exception):
        compute_jwk_thumbprint(dirty_jwk)

    # ath calculation
    dummy_token = "dpop_at_test_12345"
    ath = compute_ath(dummy_token)
    expected_ath = b64url_encode(hashlib.sha256(dummy_token.encode("ascii")).digest())
    assert ath == expected_ath


@pytest.mark.asyncio
async def test_device_authorize_and_replay_prevention(client: AsyncClient):
    """Test POST /api/dpop/device/authorize and verify replay attack rejection."""
    priv_key, jwk = generate_test_ec_key()
    url = "http://test/api/dpop/device/authorize"
    proof = create_dpop_proof(priv_key, jwk, "POST", url)

    body = {
        "device_name": "PS5-Test-Lab",
        "scope": "download:file",
        "browser_handoff": True,
        "storage": {
            "volume": "/data",
            "total_bytes": 1000000000000,
            "free_bytes": 450000000000,
        },
    }

    # 1. First authorization request succeeds
    res = await client.post(url, json=body, headers={"DPoP": proof})
    assert res.status_code == 200, res.text
    data = res.json()
    assert "device_code" in data
    assert "browser_handoff_uri" in data
    assert "#ps5=" in data["browser_handoff_uri"]
    assert "DPoP-Nonce" in res.headers
    assert "Server-Time" in res.headers

    # 2. Replaying the EXACT SAME proof JWT triggers 401 Replay Detected
    replay_res = await client.post(url, json=body, headers={"DPoP": proof})
    assert replay_res.status_code == 401
    assert "replay" in replay_res.text.lower()


@pytest.mark.asyncio
async def test_complete_end_to_end_ps5_flow(
    client: AsyncClient,
    authenticated_user: Tuple[User, str],
    sample_game_file: GameDownloadFile,
    test_db: AsyncSession,
):
    """Full End-to-End flow:
    1. PS5 initializes connection (POST /api/dpop/device/authorize)
    2. PS5 polls token (POST /api/dpop/device/token) -> 400 authorization_pending
    3. User visits site and claims handoff (POST /api/account/dpop/handoff)
    4. PS5 polls token again -> 200 OK with access/refresh token & download_url
    5. PS5 requests 0-0 probe and 32 MiB chunk (GET /dpop-download/...)
    6. PS5 refreshes token (POST /api/dpop/token/refresh)
    7. PS5 reports final SHA-256 complete (POST /api/dpop/downloads/{grant_id}/complete)
    8. Further download attempts on revoked grant are forbidden
    """
    user, user_jwt = authenticated_user
    priv_key, jwk = generate_test_ec_key()

    # Step 1: Authorize
    auth_url = "http://test/api/dpop/device/authorize"
    auth_proof = create_dpop_proof(priv_key, jwk, "POST", auth_url)
    auth_res = await client.post(
        auth_url,
        json={"device_name": "PS5-Pro-Console", "storage": {"volume": "/data", "total_bytes": 1000000000000, "free_bytes": 300000000000}},
        headers={"DPoP": auth_proof},
    )
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    device_code = auth_data["device_code"]
    handoff_secret = auth_data["browser_handoff_uri"].split("#ps5=")[1]
    assert len(handoff_secret) == 43

    # Step 2: Poll token before user selection -> 400 authorization_pending
    token_url = "http://test/api/dpop/device/token"
    poll_proof_1 = create_dpop_proof(priv_key, jwk, "POST", token_url)
    poll_res_1 = await client.post(
        token_url,
        json={"grant_type": "urn:ietf:params:oauth:grant-type:device_code", "device_code": device_code},
        headers={"DPoP": poll_proof_1},
    )
    assert poll_res_1.status_code == 400
    assert poll_res_1.json().get("error") == "authorization_pending"

    # Step 3: User claims handoff in site
    job_id = f"job_{sample_game_file.id}"
    handoff_res = await client.post(
        "http://test/api/account/dpop/handoff",
        json={"handoff": handoff_secret, "job_id": job_id},
        headers={"Authorization": f"Bearer {user_jwt}"},
    )
    assert handoff_res.status_code == 200
    assert handoff_res.json()["ok"] is True

    # Step 4: PS5 polls again -> now 200 OK!
    poll_proof_2 = create_dpop_proof(priv_key, jwk, "POST", token_url)
    poll_res_2 = await client.post(
        token_url,
        json={"grant_type": "urn:ietf:params:oauth:grant-type:device_code", "device_code": device_code},
        headers={"DPoP": poll_proof_2},
    )
    assert poll_res_2.status_code == 200
    token_data = poll_res_2.json()
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    grant_id = token_data["grant_id"]
    download_url = token_data["download_url"]
    file_info = token_data["file"]

    assert token_data["token_type"] == "DPoP"
    assert file_info["size_bytes"] == sample_game_file.size_bytes
    assert file_info["sha256"] == sample_game_file.sha256_hash

    # Step 5: Test Range Streaming
    stream_url = f"http://test/dpop-download/{job_id}/{file_info['file_name']}"

    # 5a. Single-byte probe (bytes=0-0)
    probe_proof = create_dpop_proof(priv_key, jwk, "GET", stream_url, access_token=access_token)
    probe_res = await client.get(
        stream_url,
        headers={
            "Authorization": f"DPoP {access_token}",
            "DPoP": probe_proof,
            "Range": "bytes=0-0",
        },
    )
    assert probe_res.status_code == 206
    assert probe_res.headers["Content-Range"] == f"bytes 0-0/{sample_game_file.size_bytes}"
    assert probe_res.headers["Content-Length"] == "1"
    assert len(probe_res.content) == 1

    # 5b. 32 MiB chunk request (bytes=0-33554431)
    chunk_proof = create_dpop_proof(priv_key, jwk, "GET", stream_url, access_token=access_token)
    chunk_res = await client.get(
        stream_url,
        headers={
            "Authorization": f"DPoP {access_token}",
            "DPoP": chunk_proof,
            "Range": "bytes=0-33554431",
        },
    )
    assert chunk_res.status_code == 206
    assert chunk_res.headers["Content-Range"] == f"bytes 0-33554431/{sample_game_file.size_bytes}"
    assert chunk_res.headers["Content-Length"] == "33554432"

    # Step 6: Token Refresh
    refresh_url = "http://test/api/dpop/token/refresh"
    refresh_proof = create_dpop_proof(priv_key, jwk, "POST", refresh_url)
    refresh_res = await client.post(
        refresh_url,
        json={"grant_type": "refresh_token", "refresh_token": refresh_token},
        headers={"DPoP": refresh_proof},
    )
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()
    new_access_token = refreshed_data["access_token"]
    assert new_access_token != access_token

    # Step 7: Complete download & hash verification
    complete_url = f"http://test/api/dpop/downloads/{grant_id}/complete"
    complete_proof = create_dpop_proof(priv_key, jwk, "POST", complete_url, access_token=new_access_token)
    complete_res = await client.post(
        complete_url,
        json={
            "sha256": sample_game_file.sha256_hash,
            "bytes_verified": sample_game_file.size_bytes,
            "revoke_grant": True,
        },
        headers={
            "Authorization": f"DPoP {new_access_token}",
            "DPoP": complete_proof,
        },
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["revoked"] is True
    assert complete_res.json()["sha256_verified"] is True

    # Step 8: Subsequent streaming with revoked grant is forbidden
    after_proof = create_dpop_proof(priv_key, jwk, "GET", stream_url, access_token=new_access_token)
    after_res = await client.get(
        stream_url,
        headers={
            "Authorization": f"DPoP {new_access_token}",
            "DPoP": after_proof,
            "Range": "bytes=0-100",
        },
    )
    assert after_res.status_code == 403


@pytest.mark.asyncio
async def test_console_storage_telemetry_and_account_gauge(
    client: AsyncClient,
    authenticated_user: Tuple[User, str],
):
    """Test console storage telemetry reporting and frontend gauge polling with stale flag."""
    user, user_jwt = authenticated_user
    priv_key, jwk = generate_test_ec_key()

    # 1. Authorize device
    auth_url = "http://test/api/dpop/device/authorize"
    auth_proof = create_dpop_proof(priv_key, jwk, "POST", auth_url)
    auth_res = await client.post(
        auth_url,
        json={"device_name": "PS5-LivingRoom", "storage": {"volume": "/data", "total_bytes": 1000000000000, "free_bytes": 250000000000}},
        headers={"DPoP": auth_proof},
    )
    handoff_secret = auth_res.json()["browser_handoff_uri"].split("#ps5=")[1]

    # 2. Query storage from site account with current handoff
    storage_res = await client.post(
        "http://test/api/account/storage",
        json={"handoff": handoff_secret},
        headers={"Authorization": f"Bearer {user_jwt}"},
    )
    assert storage_res.status_code == 200
    devices = storage_res.json()["devices"]
    assert len(devices) == 1
    assert devices[0]["volume"] == "/data"
    assert devices[0]["total_bytes"] == 1000000000000
    assert devices[0]["free_bytes"] == 250000000000
    assert devices[0]["stale"] is False

    # 3. Periodic report update from console
    report_url = "http://test/api/dpop/device/storage"
    report_proof = create_dpop_proof(priv_key, jwk, "POST", report_url)
    rep_res = await client.post(
        report_url,
        json={"volume": "/data", "total_bytes": 1000000000000, "free_bytes": 240000000000},
        headers={"DPoP": report_proof},
    )
    assert rep_res.status_code == 200
    assert rep_res.json()["ok"] is True
