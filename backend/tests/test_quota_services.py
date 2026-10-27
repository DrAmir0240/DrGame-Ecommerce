"""Unit tests for QuotaService: HMAC signature, charging, and consumption."""
import pytest
from app.modules.quota.services import QuotaService
from app.core.exceptions import AuthorizationError

def test_hmac_signature_verification():
    user_id = 55
    game_id = 10
    bytes_downloaded = 10737418240  # 10 GB
    server_id = "cdn-tehran-01"

    sig = QuotaService.generate_webhook_signature(user_id, game_id, bytes_downloaded, server_id)
    assert isinstance(sig, str)
    assert len(sig) == 64

    # Valid check
    assert QuotaService.verify_webhook_signature(user_id, game_id, bytes_downloaded, server_id, sig) is True

    # Tampered bytes check
    assert QuotaService.verify_webhook_signature(user_id, game_id, 500, server_id, sig) is False

@pytest.mark.asyncio
async def test_quota_charge_and_consumption(test_db, fake_redis):
    user_id = 77

    # 1. Initial quota is 0
    q1 = await QuotaService.get_user_quota(test_db, fake_redis, user_id)
    assert q1["total_quota_gb"] == 0.0

    # 2. Charge 500 GB
    q2 = await QuotaService.charge_user_quota(test_db, fake_redis, user_id, 500.0)
    assert q2["total_quota_gb"] == 500.0
    assert q2["remaining_quota_gb"] == 500.0

    # 3. Consume 50 GB via signed webhook
    bytes_50gb = int(50 * (1024 ** 3))
    server_id = "cdn-shiraz-02"
    sig = QuotaService.generate_webhook_signature(user_id, 1, bytes_50gb, server_id)

    consume_res = await QuotaService.consume_quota_from_webhook(
        test_db, fake_redis, user_id, 1, bytes_50gb, server_id, sig
    )
    assert consume_res["status"] == "success"
    assert round(consume_res["gb_deducted"]) == 50

    # 4. Check remaining quota
    q3 = await QuotaService.get_user_quota(test_db, fake_redis, user_id)
    assert round(q3["remaining_quota_gb"]) == 450
    assert round(q3["used_quota_gb"]) == 50

    # 5. Invalid HMAC signature raises AuthorizationError
    with pytest.raises(AuthorizationError):
        await QuotaService.consume_quota_from_webhook(
            test_db, fake_redis, user_id, 1, bytes_50gb, server_id, "BAD_SIGNATURE"
        )
