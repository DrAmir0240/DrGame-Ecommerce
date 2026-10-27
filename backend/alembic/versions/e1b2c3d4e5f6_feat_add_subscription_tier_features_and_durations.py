"""feat: add subscription tier features and durations

Revision ID: e1b2c3d4e5f6
Revises: fbb0edbfd0f9
Create Date: 2026-10-26 18:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1b2c3d4e5f6'
down_revision: Union[str, None] = 'fbb0edbfd0f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add allow_data, allow_cheat, allow_dubbing and durations JSON to subscription_tiers
    op.add_column('subscription_tiers', sa.Column('allow_data', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('subscription_tiers', sa.Column('allow_cheat', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('subscription_tiers', sa.Column('allow_dubbing', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('subscription_tiers', sa.Column('durations', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('subscription_tiers', 'durations')
    op.drop_column('subscription_tiers', 'allow_dubbing')
    op.drop_column('subscription_tiers', 'allow_cheat')
    op.drop_column('subscription_tiers', 'allow_data')
