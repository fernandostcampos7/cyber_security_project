"""add products fts5

Revision ID: 3cf3732e07fb
Revises: 1ab1e38e2728
Create Date: 2025-11-15 19:05:39.355991

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "3cf3732e07fb"
down_revision: Union[str, None] = "1ab1e38e2728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create FTS5 table indexing name, brand, category only
    op.execute(
        """
        CREATE VIRTUAL TABLE products_fts USING fts5(
            name,
            brand,
            category,
            content='products',
            content_rowid='id'
        );
        """
    )

    # Backfill existing products into FTS (no description)
    op.execute(
        """
        INSERT INTO products_fts(rowid, name, brand, category)
        SELECT id, name, brand, category
        FROM products;
        """
    )

    # Keep FTS in sync via triggers
    op.execute(
        """
        CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
            INSERT INTO products_fts(rowid, name, brand, category)
            VALUES (new.id, new.name, new.brand, new.category);
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
            UPDATE products_fts
            SET name = new.name,
                brand = new.brand,
                category = new.category
            WHERE rowid = new.id;
        END;
        """
    )

    op.execute(
        """
        CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
            DELETE FROM products_fts WHERE rowid = old.id;
        END;
        """
    )


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS products_ad;")
    op.execute("DROP TRIGGER IF EXISTS products_au;")
    op.execute("DROP TRIGGER IF EXISTS products_ai;")
    op.execute("DROP TABLE IF EXISTS products_fts;")
