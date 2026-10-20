"""Initial baseline schema

Revision ID: 0001_initial_baseline
Revises: 
Create Date: 2026-10-20 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # User Profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('bio', sa.String(length=300), nullable=True),
        sa.Column('gamer_tag', sa.String(length=50), nullable=True),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_playtime_hours', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('streak_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('wallet_balance', sa.Numeric(precision=15, scale=0), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_user_profiles_user_id'), 'user_profiles', ['user_id'], unique=True)

    # Subscription Tiers table
    op.create_table(
        'subscription_tiers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=15, scale=0), nullable=False, server_default='0'),
        sa.Column('duration_days', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('quota_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('max_download_speed_mbps', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('allowed_platforms', sa.JSON(), nullable=False),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('limitations', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_subscription_tiers_id'), 'subscription_tiers', ['id'], unique=False)
    op.create_index(op.f('ix_subscription_tiers_name'), 'subscription_tiers', ['name'], unique=True)
    op.create_index(op.f('ix_subscription_tiers_slug'), 'subscription_tiers', ['slug'], unique=True)

    # User Subscriptions table
    op.create_table(
        'user_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tier_id', sa.Integer(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_quota_bytes', sa.BigInteger(), nullable=False),
        sa.Column('used_quota_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_subscriptions_id'), 'user_subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_user_subscriptions_user_id'), 'user_subscriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_subscriptions_tier_id'), 'user_subscriptions', ['tier_id'], unique=False)


def downgrade() -> None:
    op.drop_table('user_subscriptions')
    op.drop_table('subscription_tiers')
    op.drop_table('user_profiles')
    op.drop_table('users')
