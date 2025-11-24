"""add unique review constraint

Revision ID: cf6a2e24fee8
Revises: 4d1602e40cfe
Create Date: 2025-11-18 11:03:16.095305
"""

from typing import Sequence, Union
from alembic import op

revision: str = "cf6a2e24fee8"
down_revision: Union[str, None] = "4d1602e40cfe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_reviews_user_product",
        "reviews",
        ["user_id", "product_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_reviews_user_product", table_name="reviews")
