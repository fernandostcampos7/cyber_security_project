# backend/db/bootstrap.py

from sqlalchemy import inspect

from backend.db.database import engine, SessionLocal
from backend.models import models as m
from backend.models.models import User, Product
from backend.scripts.seed_users import seed as seed_users
from backend.scripts.seed_products import seed_products


def bootstrap_db_once() -> None:
    """
    Create tables if needed and seed initial data, but only
    if the DB is empty (no users/products).
    Safe to call on every startup.
    """
    inspector = inspect(engine)

    # Ensure tables exist
    m.Base.metadata.create_all(bind=engine)

    # Check if we already have at least one user and product
    with SessionLocal() as db:
        has_user = db.query(User).first()
        has_product = db.query(Product).first()

    if has_user and has_product:
        # Already seeded, do nothing
        return

    # Seed initial data
    seed_users()
    seed_products()
