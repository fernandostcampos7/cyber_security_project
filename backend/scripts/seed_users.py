from backend.db.database import SessionLocal
from backend.models.models import User
from argon2 import PasswordHasher

ph = PasswordHasher()
DEFAULT_PW = ph.hash("Test1234!")


def seed_users_if_needed() -> None:
    """
    Ensure default users exist and have the expected roles.
    Safe to call on every startup.
    """
    db = SessionLocal()
    try:
        # If we already have an admin, assume seeding has run
        if db.query(User).filter_by(role="admin").first():
            return

        def upsert(email: str, role: str) -> None:
            user = db.query(User).filter_by(email=email).first()
            if user:
                user.role = role
                user.password_hash = DEFAULT_PW
            else:
                db.add(User(email=email, role=role, password_hash=DEFAULT_PW))

        upsert("admin@example.com", "admin")
        upsert("buyer@example.com", "customer")
        upsert("seller@example.com", "seller")

        db.commit()
        print("Seeded default users.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users_if_needed()
