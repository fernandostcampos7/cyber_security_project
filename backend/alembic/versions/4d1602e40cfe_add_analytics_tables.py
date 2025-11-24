"""add analytics tables

Revision ID: 4d1602e40cfe
Revises: 3cf3732e07fb
Create Date: 2025-11-17 11:10:30.049016

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4d1602e40cfe"
down_revision: Union[str, None] = "3cf3732e07fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "view_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("path", sa.String, nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "interaction_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("action", sa.String, nullable=False),
        sa.Column("metadata", sa.String, nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )


def downgrade() -> None:
    op.drop_table("interaction_events")
    op.drop_table("view_events")
