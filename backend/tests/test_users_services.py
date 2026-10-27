"""Unit tests for UserService: profile fetch, update, password change, session revoke."""
import pytest
from app.core.security import hash_password, verify_password
from app.modules.users.models import User
from app.modules.auth.models import UserSession
from app.modules.users.services import UserService
from app.modules.users.schemas import UserProfileUpdate, ChangePasswordRequest
from app.core.exceptions import NotFoundError, BadRequestError

@pytest.mark.asyncio
async def test_user_service_profile_update(test_db):
    user = User(
        full_name="Kratos Ghost of Sparta",
        username="kratos",
        password_hash=hash_password("Boy12345"),
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Fetch profile
    profile = await UserService.get_user_profile(test_db, user.id)
    assert profile.full_name == "Kratos Ghost of Sparta"

    # Update profile avatar and name
    update_data = UserProfileUpdate(
        full_name="Kratos God of War",
        avatar_url="/avatars/kratos.png"
    )
    updated = await UserService.update_user_profile(test_db, user.id, update_data)
    assert updated.full_name == "Kratos God of War"
    assert updated.avatar_url == "/avatars/kratos.png"

@pytest.mark.asyncio
async def test_user_service_change_password(test_db):
    user = User(
        full_name="Aloy Nora",
        username="aloy",
        password_hash=hash_password("OldPassword123"),
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Change password with wrong current password should fail
    with pytest.raises(BadRequestError):
        await UserService.change_password(
            test_db,
            user.id,
            ChangePasswordRequest(current_password="WrongOld", new_password="NewPassword456")
        )

    # Change password with correct current password
    await UserService.change_password(
        test_db,
        user.id,
        ChangePasswordRequest(current_password="OldPassword123", new_password="NewPassword456")
    )
    await test_db.refresh(user)
    assert verify_password("NewPassword456", user.password_hash) is True

@pytest.mark.asyncio
async def test_user_service_session_revocation(test_db, fake_redis):
    user = User(
        full_name="Spider Man",
        username="spidey",
        password_hash=hash_password("WebSlinger123"),
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    session = UserSession(
        user_id=user.id,
        jti="spidey-jti-123",
        device_name="PS5 DualSense",
        device_type="console",
        is_active=True
    )
    test_db.add(session)
    await test_db.commit()
    await test_db.refresh(session)

    # List sessions
    sessions = await UserService.get_user_sessions(test_db, user.id)
    assert len(sessions) == 1
    assert sessions[0].device_name == "PS5 DualSense"

    # Revoke session
    await UserService.revoke_session(test_db, fake_redis, user.id, session.id)
    await test_db.refresh(session)
    assert session.is_active is False

    # JTI is blacklisted in Redis
    blacklisted = await fake_redis.get("drgame:blacklist:jti:spidey-jti-123")
    assert blacklisted == "blacklisted"
