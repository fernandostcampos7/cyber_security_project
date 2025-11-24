from flask import Blueprint, request, jsonify
from sqlalchemy import text

from backend.security.analytics import log_interaction
from backend.db.database import SessionLocal
from backend.security.rbac import require_role

bp = Blueprint("analytics", __name__)


@bp.get("/api/admin/analytics")
@require_role("admin")
def admin_analytics():
    """
    Admin view of all recorded page views and interactions.
    No artificial record limit; newest first.
    """
    db = SessionLocal()
    try:
        # ---- Views: take ALL columns, newest by id ----
        views_rows = (
            db.execute(
                text(
                    """
                    SELECT *
                    FROM view_events
                    ORDER BY id DESC
                    """
                )
            )
            .mappings()
            .all()
        )

        # ---- Interactions: take ALL columns, newest by id ----
        interactions_rows = (
            db.execute(
                text(
                    """
                    SELECT *
                    FROM interaction_events
                    ORDER BY id DESC
                    """
                )
            )
            .mappings()
            .all()
        )

        # Just send raw rows; frontend will pick the fields it cares about
        return jsonify(
            {
                "views": [dict(r) for r in views_rows],
                "interactions": [dict(r) for r in interactions_rows],
            }
        ), 200
    finally:
        db.close()


@bp.post("/api/analytics/interaction")
def record_event():
    data = request.get_json() or {}

    action = data.get("action")
    metadata = data.get("metadata")

    if not isinstance(action, str) or not action.strip():
        return jsonify(error="Missing action"), 400

    if metadata is not None and not isinstance(metadata, str):
        metadata = str(metadata)

    log_interaction(action, metadata)
    return jsonify(ok=True), 200
