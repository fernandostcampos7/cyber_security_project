from backend.db.database import SessionLocal
from backend.models.models import User
from argon2 import PasswordHasher

ph = PasswordHasher()
pw = ph.hash("Test1234!")


def seed():
    db = SessionLocal()
    try:
        users = [
            User(email="admin@example.com", role="admin", password_hash=pw),
            User(email="buyer@example.com", role="customer", password_hash=pw),
            User(email="seller@example.com", role="seller", password_hash=pw),
        ]
        db.add_all(users)
        db.commit()
        print("Users created.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
