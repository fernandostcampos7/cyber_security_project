from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from backend.db.database import SessionLocal
from backend.models.models import ViewEvent, InteractionEvent
from backend.security.rbac import require_role

bp = Blueprint("admin_analytics", __name__)


@bp.get("/api/admin/analytics/views")
@require_role("admin")
def list_view_events():
    """Recent page views."""
    limit = request.args.get("limit", 300, type=int) or 300
    limit = min(max(limit, 1), 300)

    db = SessionLocal()
    try:
        events = (
            db.query(ViewEvent).order_by(desc(ViewEvent.occurred_at)).limit(limit).all()
        )

        items = []
        for e in events:
            items.append(
                {
                    "id": e.id,
                    "user_id": e.user_id,
                    "session_id": getattr(e, "session_id", None),
                    "path": e.path,
                    "product_id": getattr(e, "product_id", None),
                    "referrer": getattr(e, "referrer", None),
                    "user_agent": getattr(e, "user_agent", None),
                    "occurred_at": e.occurred_at.isoformat()
                    if getattr(e, "occurred_at", None)
                    else None,
                }
            )
        return jsonify(items=items)
    finally:
        db.close()


@bp.get("/api/admin/analytics/interactions")
@require_role("admin")
def list_interaction_events():
    """Recent key interactions like add_to_cart, checkout, review_submitted."""
    limit = request.args.get("limit", 300, type=int) or 300
    limit = min(max(limit, 1), 300)

    db = SessionLocal()
    try:
        events = (
            db.query(InteractionEvent)
            .order_by(desc(InteractionEvent.occurred_at))
            .limit(limit)
            .all()
        )

        items = []
        for e in events:
            items.append(
                {
                    "id": e.id,
                    "user_id": e.user_id,
                    "session_id": getattr(e, "session_id", None),
                    "action": getattr(e, "event_type", getattr(e, "action", None)),
                    "metadata": getattr(e, "event_data", getattr(e, "metadata", None)),
                    "occurred_at": e.occurred_at.isoformat()
                    if getattr(e, "occurred_at", None)
                    else None,
                }
            )
        return jsonify(items=items)
    finally:
        db.close()
