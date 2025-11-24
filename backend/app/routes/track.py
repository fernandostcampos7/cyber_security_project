from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..auth import get_current_user, login_required
from ..db import db_session
from ..models import EventInteraction, EventView, to_dict

bp = Blueprint("track", __name__)


@bp.post("/api/track/view")
def track_view():
    payload = request.get_json(force=True)
    event = EventView(
        user_id=(get_current_user().id if get_current_user() else None),
        session_id=payload.get("session_id"),
        path=payload.get("path"),
        product_id=payload.get("product_id"),
        referrer=payload.get("referrer"),
        user_agent=request.headers.get("User-Agent"),
    )
    db_session.add(event)
    db_session.commit()
    return jsonify({"event": to_dict(event)})


@bp.post("/api/track/interaction")
def track_interaction():
    payload = request.get_json(force=True)
    event = EventInteraction(
        user_id=(get_current_user().id if get_current_user() else None),
        session_id=payload.get("session_id"),
        event_type=payload.get("event_type"),
        event_data=payload.get("event_data", {}),
    )
    db_session.add(event)
    db_session.commit()
    return jsonify({"event": to_dict(event)})


@bp.get("/api/privacy/export")
@login_required()
def privacy_export(user):
    views = db_session.query(EventView).filter_by(user_id=user.id).all()
    interactions = db_session.query(EventInteraction).filter_by(user_id=user.id).all()
    return jsonify({
        "views": [to_dict(view) for view in views],
        "interactions": [to_dict(interaction) for interaction in interactions],
    })


@bp.post("/api/privacy/delete")
@login_required()
def privacy_delete(user):
    db_session.query(EventView).filter_by(user_id=user.id).delete()
    db_session.query(EventInteraction).filter_by(user_id=user.id).delete()
    db_session.commit()
    return {"status": "deleted"}


__all__ = ["bp"]
