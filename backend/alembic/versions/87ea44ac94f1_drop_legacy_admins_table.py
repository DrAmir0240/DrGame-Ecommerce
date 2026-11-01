"""drop_legacy_admins_table

Revision ID: 87ea44ac94f1
Revises: 6d4fe6759a20
Create Date: 2026-11-01 06:03:19.049480

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87ea44ac94f1'
down_revision: Union[str, None] = '6d4fe6759a20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS admins CASCADE")


def downgrade() -> None:
    pass

