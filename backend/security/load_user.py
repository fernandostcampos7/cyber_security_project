from flask import g, session
from backend.db.database import SessionLocal
from backend.models.models import User


def load_user():
    user_id = session.get("user_id")

    if not user_id:
        g.current_user = None
        return

    db = SessionLocal()
    try:
        g.current_user = db.query(User).filter_by(id=user_id).first()
    finally:
        db.close()
