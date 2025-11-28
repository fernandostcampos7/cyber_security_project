import os

from flask import Blueprint, jsonify, g, session
from backend.db.database import SessionLocal
from backend.models.models import User, SellerApplication
from backend.security.rbac import require_login
from backend.security.passwords import hash_password

bp = Blueprint("account", __name__)


@bp.post("/api/account/upgrade-seller")
@require_login
def upgrade_to_seller():
    """
    Seller *request* flow (Option B):
    - customers can hit this to request seller access
    - logs a SellerApplication row with status 'pending'
    - does NOT change user.role
    - admin later promotes via /api/admin/users/<id>
    """
    db = SessionLocal()
    try:
        user: User = g.current_user

        if user.role in ("seller", "admin"):
            return jsonify(
                {
                    "ok": False,
                    "message": "You already have seller or admin access.",
                }
            ), 400

        # Log the request as pending
        app = SellerApplication(
            user_id=user.id,
            status="pending",
            note="User requested seller upgrade",
            decided_by=None,
        )
        db.add(app)
        db.commit()

        return jsonify(
            {
                "ok": True,
                "message": "Your seller request has been received. An admin will review your account.",
            }
        ), 200
    finally:
        db.close()


@bp.delete("/api/account/me")
@require_login
def delete_my_account():
    """
    Self-service account deletion.

    Privacy friendly behaviour:
    - Keep the User row for referential integrity
    - Anonymise email and any optional personal fields
    - Invalidate the password so login is no longer possible
    - Clear the current session
    """
    db = SessionLocal()
    try:
        current: User = g.current_user
        user = db.query(User).get(current.id)
        if not user:
            return jsonify({"ok": False, "error": "User not found"}), 404

        # Anonymise email so it is no longer personally identifiable
        if not user.email.startswith("deleted+"):
            user.email = f"deleted+{user.id}@example.invalid"

        # Invalidate password so the account cannot be used again
        user.password_hash = hash_password(os.urandom(32).hex())

        # Optional extra scrubbing if these fields exist
        if hasattr(user, "name"):
            user.name = "Deleted user"
        if hasattr(user, "full_name"):
            user.full_name = "Deleted user"

        db.commit()

        # Log the user out
        session.clear()

        return jsonify(
            {
                "ok": True,
                "message": "Your account has been deleted and personal data anonymised.",
            }
        ), 200
    finally:
        db.close()
