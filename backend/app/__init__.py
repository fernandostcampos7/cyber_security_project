import logging
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS

from .db import db_session, init_db
from .security import apply_security_headers, init_rate_limiter
from .routes import register_blueprints


def create_app(testing: bool = False) -> Flask:
    """Application factory for the LePax backend."""
    app = Flask(__name__)
    app.config.setdefault("JSON_SORT_KEYS", False)
    app.config.setdefault("JSONIFY_PRETTYPRINT_REGULAR", False)
    app.config.setdefault("SESSION_COOKIE_SAMESITE", "Lax")
    app.config.setdefault("SESSION_COOKIE_SECURE", True)
    app.config.setdefault("PERMANENT_SESSION_LIFETIME", timedelta(minutes=30))

    app.config.setdefault("SECRET_KEY", "changeme")

    # Database setup
    init_db()

    # CORS restricted to configured FE origin
    fe_origin = app.config.get("FE_ORIGIN") or "http://localhost:5173"
    CORS(
        app,
        resources={r"/api/*": {"origins": [fe_origin]}},
        supports_credentials=True,
    )

    apply_security_headers(app)
    init_rate_limiter(app)

    register_blueprints(app)

    @app.teardown_appcontext
    def shutdown_session(exception: Exception | None = None) -> None:  # pragma: no cover
        if exception:
            logging.getLogger(__name__).exception("App context teardown", exc_info=exception)
        db_session.remove()

    @app.route("/health")
    def health() -> tuple[dict[str, str], int]:
        return jsonify({"status": "ok"}), 200

    return app


__all__ = ["create_app"]
