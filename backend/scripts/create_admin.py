"""CLI script to create or seed an admin user in DrGame database."""
import asyncio
import sys
from sqlalchemy import select, or_

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.admin_models import AdminUser


async def create_or_seed_admin(username: str, email: str, password: str, role: str = "superadmin"):
    async with AsyncSessionLocal() as db:
        stmt = select(AdminUser).where(
            or_(AdminUser.username == username.strip(), AdminUser.email == email.strip().lower())
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            # If user already exists, update their password so login is guaranteed to work
            existing.password_hash = hash_password(password)
            existing.is_active = True
            existing.role = role
            await db.commit()
            print(f"Existing admin '{existing.username}' updated with new credentials.")
            return existing

        admin = AdminUser(
            username=username.strip(),
            email=email.strip().lower(),
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        print(f"Admin '{admin.username}' created successfully with role '{admin.role}'!")
        return admin


if __name__ == "__main__":
    user = sys.argv[1] if len(sys.argv) > 1 else "admin"
    pwd = sys.argv[2] if len(sys.argv) > 2 else "DrGame@Admin2026!"
    mail = sys.argv[3] if len(sys.argv) > 3 else "admin@drgame.ir"
    role_arg = sys.argv[4] if len(sys.argv) > 4 else "superadmin"

    asyncio.run(create_or_seed_admin(user, mail, pwd, role_arg))
