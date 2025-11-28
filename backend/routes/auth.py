from flask import Blueprint, request, session
from backend.db.database import SessionLocal
from backend.models.models import User
from backend.security.passwords import hash_password, verify_password
from flask import jsonify

bp = Blueprint("auth", __name__)


@bp.post("/api/auth/register")
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Missing fields"}, 400

    db = SessionLocal()
    try:
        # check existing
        if db.query(User).filter_by(email=email).first():
            return {"error": "email exists"}, 409

        user = User(email=email, password_hash=hash_password(password), role="customer")
        db.add(user)
        db.commit()
        return {"ok": True}, 201
    finally:
        db.close()


@bp.post("/api/auth/login")
def login():
    # Be tolerant of bad JSON
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    # Explicit validation for missing fields
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()

        # Same generic error for “user not found” or “password wrong”
        if not user or not verify_password(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 400

        # Store user id in session for require_role / load_user
        session["user_id"] = user.id

        return jsonify(
            ok=True,
            user={
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
        ), 200

    finally:
        db.close()


@bp.post("/api/auth/logout")
def logout():
    session.clear()
    return {"ok": True}
