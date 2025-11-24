from flask import Blueprint, request, jsonify, g
from backend.db.database import SessionLocal
from backend.models.models import User
from backend.security.rbac import require_role

bp = Blueprint("admin", __name__)

@bp.get("/api/admin/users")
@require_role("admin")
def list_users():
    """
    Return a list of all users for admin.
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()

        items = []
        for u in users:
            items.append(
                {
                    "id": u.id,
                    "email": u.email,
                    "full_name": getattr(u, "full_name", "") or "",
                    "role": u.role,
                    "created_at": str(getattr(u, "created_at", "")),
                }
            )

        return jsonify(items=items)
    finally:
        db.close()


@bp.patch("/api/admin/users/<int:user_id>")
@require_role("admin")
def update_user(user_id: int):
    """
    Allow admin to change a user's role (customer / seller / admin).
    """
    data = request.get_json(silent=True) or {}
    new_role = data.get("role")

    valid_roles = {"customer", "seller", "admin"}
    if new_role not in valid_roles:
        return jsonify(error="Invalid role"), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify(error="User not found"), 404

        current = g.current_user
        if user.id == current.id and new_role != "admin":
            return jsonify(error="You cannot change your own admin status"), 400

        user.role = new_role
        db.commit()
        db.refresh(user)

        return jsonify(
            ok=True,
            user={
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
        )
    finally:
        db.close()
