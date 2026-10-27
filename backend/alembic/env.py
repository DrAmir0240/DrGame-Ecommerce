import asyncio
from logging.config import fileConfig
from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from app.core.config import settings
from app.core.database import Base

# Import all models for autogenerate detection
try:
    from app.modules.auth.models import *
except ImportError:
    pass

try:
    from app.modules.auth.admin_models import *
except ImportError:
    pass

try:
    from app.modules.users.models import *
except ImportError:
    pass

try:
    from app.modules.games.models import *
except ImportError:
    pass

try:
    from app.modules.subscriptions.models import *
except ImportError:
    pass

try:
    from app.modules.quota.models import *
except ImportError:
    pass

try:
    from app.modules.wallet.models import *
except ImportError:
    pass

try:
    from app.modules.news.models import *
except ImportError:
    pass

try:
    from app.modules.home.banner_models import *
except ImportError:
    pass

try:
    from app.modules.tickets.models import *
except ImportError:
    pass

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.SQLALCHEMY_DATABASE_URI
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.SQLALCHEMY_DATABASE_URI

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
