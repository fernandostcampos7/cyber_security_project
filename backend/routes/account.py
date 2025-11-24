from flask import Blueprint, jsonify, g
from backend.db.database import SessionLocal
from backend.models.models import User, SellerApplication
from backend.security.rbac import require_login

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
                    "message": "You already have seller or admin access."
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
                "message": "Your seller request has been received. An admin will review your account."
            }
        ), 200
    finally:
        db.close()

