from typing import Optional, Any

from flask import g, request

from backend.db.database import SessionLocal
from backend.models.models import ViewEvent, InteractionEvent


def _get_session_id() -> str:
    """
    Guarantee a non NULL session_id for both events.

    Priority:
      1. g.session_id (if you set it somewhere in middleware)
      2. X-Session-Id header
      3. literal "anonymous"
    """
    return (
        getattr(g, "session_id", None)
        or request.headers.get("X-Session-Id")
        or "anonymous"
    )


def log_view(path: str, product_id: Optional[int] = None) -> None:
    """
    Log a page view.

    path: the request path you want to record
    product_id: optional, if this view is for a specific product
    """
    # Avoid CORS preflight noise
    if request.method == "OPTIONS":
        return

    db = SessionLocal()
    try:
        user = getattr(g, "current_user", None)
        user_id = getattr(user, "id", None)

        session_id = _get_session_id()

        ev = ViewEvent(
            user_id=user_id,
            session_id=session_id,
            path=path,
            product_id=product_id,
            referrer=request.referrer,
            user_agent=request.headers.get("User-Agent"),
            # occurred_at has a default of now(), so we could omit it,
            # but setting it explicitly is also fine if you prefer:
            # occurred_at=datetime.utcnow(),
        )
        db.add(ev)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def log_interaction(action: str, metadata: Optional[Any] = None) -> None:
    """
    Log a user interaction.

    action: a short code like "add_to_cart", "checkout_start", "search"
    metadata: anything JSON serialisable (dict, list, string, etc.)
    """
    if request.method == "OPTIONS":
        return

    db = SessionLocal()
    try:
        user = getattr(g, "current_user", None)
        user_id = getattr(user, "id", None)
        session_id = _get_session_id()

        ev = InteractionEvent(
            user_id=user_id,
            session_id=session_id,
            event_type=action,  # maps your old "action" param to the event_type column
            event_data=metadata,  # maps "metadata" to event_data JSON column
            # occurred_at default is now(), so no need to pass it
        )
        db.add(ev)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
