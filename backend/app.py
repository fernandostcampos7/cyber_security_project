import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_talisman import Talisman

# Security helpers
from backend.security.load_user import load_user
from backend.security.analytics import log_view

# Blueprints
from backend.routes.products import bp as products_bp
from backend.routes.auth import bp as auth_bp
from backend.routes.admin_users import bp as admin_users_bp
from backend.routes.uploads import bp as uploads_bp
from backend.routes.reviews import bp as reviews_bp
from backend.routes.account import bp as account_bp
from backend.routes.checkout import bp as checkout_bp
from backend.routes.analytics import bp as analytics_bp
from backend.routes.admin_analytics import bp as admin_analytics_bp
from backend.routes.seller import bp as seller_bp
from backend.routes.orders import bp as orders_bp
from backend.routes.payments_stripe import bp as stripe_payments_bp


def create_app():
    app = Flask(__name__)

    # Core security config
    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret"),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=os.getenv("SESSION_COOKIE_SECURE", "0") == "1",
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=4),
        STRIPE_SECRET_KEY=os.getenv("STRIPE_SECRET_KEY"),
        STRIPE_WEBHOOK_SECRET=os.getenv("STRIPE_WEBHOOK_SECRET"),
    )

    # Media uploads
    upload_root = Path(__file__).resolve().parent / "uploads"
    upload_root.mkdir(parents=True, exist_ok=True)
    app.config["UPLOAD_ROOT"] = upload_root

    # CORS for the frontend
    CORS(
        app,
        resources={
            r"/api/*": {  # note the /* for all API routes
                "origins": [
                    "http://localhost:5173",
                    "https://cyber-security-project-1-niwo.onrender.com",
                ]
            }
        },
        supports_credentials=True,
    )

    # Content Security Policy
    csp = {
        "default-src": "'self'",
        "img-src": "'self' data:",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline'",
        "connect-src": (
            "'self' https://api.stripe.com https://*.stripe.com https://*.paypal.com"
        ),
        "frame-src": "https://js.stripe.com https://*.paypal.com",
    }

    # Talisman
    Talisman(
        app,
        force_https=False,
        content_security_policy=csp,
        strict_transport_security=True,
    )

    # Extra headers
    @app.after_request
    def security_headers(response):
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    # Attach logged user
    @app.before_request
    def attach_user():
        load_user()

    # Log every view (basic analytics)
    @app.before_request
    def log_every_view():
        # Skip CORS preflight
        if request.method == "OPTIONS":
            return

        # Only log GET requests
        if request.method != "GET":
            return

        path = request.path

        # Skip obvious noise
        if path == "/favicon.ico":
            return
        if path.startswith("/static"):
            return
        if path.startswith("/api/auth"):
            return  # do not log login/logout/register endpoints

        # Log remaining views
        log_view(path=path, product_id=None)

    # Register blueprints
    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(admin_users_bp)
    app.register_blueprint(checkout_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_analytics_bp)
    app.register_blueprint(seller_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(stripe_payments_bp)


    # Root and health checks
    @app.get("/")
    def index():
        return jsonify(status="ok", message="LePax backend root"), 200

    @app.get("/health")
    def health():
        return jsonify(status="ok", service="lepax-backend"), 200

    @app.get("/api/health")
    def api_health():
        return jsonify(status="ok", api="v1"), 200

    return app


# For flask run
app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=True)
