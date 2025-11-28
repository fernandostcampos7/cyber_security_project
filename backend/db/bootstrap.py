# backend/db/bootstrap.py

from sqlalchemy import inspect

from backend.db.database import engine, SessionLocal
from backend.models import models as m
from backend.models.models import User, Product
from backend.scripts.seed_users import seed as seed_users
from backend.scripts.seed_products import seed_products


def normalise_roles() -> None:
    """
    Force roles into the exact strings that RBAC expects.
    Safe to run on every startup.
    """
    with SessionLocal() as db:
        users = db.query(User).all()
        changed = False

        for user in users:
            if not user.role:
                continue

            original = user.role

            # Map common variants to the canonical values
            if original.upper() == "ADMIN":
                user.role = "admin"
            elif original.upper() == "SELLER":
                user.role = "seller"
            elif original.upper() == "CUSTOMER":
                user.role = "customer"

            if user.role != original:
                changed = True

        if changed:
            db.commit()


def bootstrap_db_once() -> None:
    """
    Create tables if needed and seed initial data, but only
    if the DB is empty (no users/products).
    Safe to call on every startup.
    """
    inspector = inspect(engine)

    # Ensure tables exist
    m.Base.metadata.create_all(bind=engine)

    # Run role normalisation on every startup
    normalise_roles()

    # Check if we already have at least one user and product
    with SessionLocal() as db:
        has_user = db.query(User).first()
        has_product = db.query(Product).first()

    if has_user and has_product:
        # Already seeded, nothing else to do
        return

    # Seed initial data
    seed_users()
    seed_products()

    # Normalise again just in case seeds had funny casing
    normalise_roles()
