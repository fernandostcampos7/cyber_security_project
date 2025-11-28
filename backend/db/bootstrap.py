from sqlalchemy import inspect

from backend.db.database import engine, SessionLocal
from backend.models import models as m
from backend.models.models import User, Product
from backend.scripts.seed_users import seed as seed_users
from backend.scripts.seed_products import seed_products


def normalise_roles_to_lowercase() -> None:
    """
    Ensure all user roles are stored in lowercase.
    This keeps the data consistent with RBAC checks that expect 'admin', 'seller', 'customer', etc.
    Safe to run on every startup.
    """
    with SessionLocal() as db:
        users = db.query(User).all()
        changed = False

        for user in users:
            if user.role and user.role != user.role.lower():
                user.role = user.role.lower()
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

    # Check if we already have at least one user and product
    with SessionLocal() as db:
        has_user = db.query(User).first()
        has_product = db.query(Product).first()

    # Always normalise roles, regardless of whether we seed or not
    normalise_roles_to_lowercase()

    if has_user and has_product:
        # Already seeded, do nothing
        return

    # Seed initial data
    seed_users()
    seed_products()

    # Normalise again in case seeds used weird casing
    normalise_roles_to_lowercase()
