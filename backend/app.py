import os
from datetime import timedelta
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_talisman import Talisman
from dotenv import load_dotenv

from backend.db.database import engine, Base, SessionLocal
from backend.models import models  # noqa: F401
from backend.models.models import User, Product
from backend.security.passwords import hash_password

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

load_dotenv()


# -------------------------------------------------
# 1.  AUTO SEEDING HELPERS
# -------------------------------------------------
def seed_initial_data() -> None:
    """
    Ensure default users and demo products exist.

    Safe to call on every startup:
    - Users are upserted by email.
    - Products are upserted by seo_slug.
    """
    db = SessionLocal()
    try:
        # Default password for seeded accounts
        default_pw = hash_password("Test1234!")

        def upsert_user(email: str, role: str) -> None:
            user = db.query(User).filter_by(email=email).first()
            if user:
                user.role = role
                user.password_hash = default_pw
            else:
                db.add(User(email=email, role=role, password_hash=default_pw))

        # Ensure core accounts always exist
        upsert_user("admin@example.com", "admin")
        upsert_user("buyer@example.com", "customer")
        upsert_user("seller@example.com", "seller")

        # Demo products, keyed by seo_slug
        demo_products = [
            {
                "owner_id": None,
                "sku": "SKU-DEMO-001",
                "name": "Aurora Leather Tote",
                "brand": "Maison Luma",
                "category": "Bags",
                "description_md": "Minimalist calf leather tote with reinforced stitching.",
                "price_cents": 45000,
                "currency": "GBP",
                "active": True,
                "seo_slug": "aurora-leather-tote",
                "hero_image_url": "https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?w=800",
            },
            {
                "owner_id": None,
                "sku": "SKU-DEMO-002",
                "name": "Midnight Trench Coat",
                "brand": "Noir Atelier",
                "category": "Coats",
                "description_md": "Structured trench coat crafted for all year elegance.",
                "price_cents": 69000,
                "currency": "GBP",
                "active": True,
                "seo_slug": "midnight-trench-coat",
                "hero_image_url": "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?w=800",
            },
        ]

        for data in demo_products:
            slug = data["seo_slug"]
            existing = db.query(Product).filter_by(seo_slug=slug).first()
            if existing:
                for key, value in data.items():
                    setattr(existing, key, value)
            else:
                db.add(Product(**data))

        db.commit()
        print("Seeded default users and demo products.")
    except Exception as e:
        db.rollback()
        print("Seeding error:", repr(e))
    finally:
        db.close()


# -------------------------------------------------
# 2.  APP FACTORY
# -------------------------------------------------
def create_app():
    app = Flask(__name__)

    # Core config
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
            r"/api/*": {
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

    Talisman(
        app,
        force_https=False,
        content_security_policy=csp,
        strict_transport_security=True,
    )

    @app.after_request
    def security_headers(response):
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    # Attach logged user
    @app.before_request
    def attach_user():
        load_user()

    # Log every GET view except obvious noise
    @app.before_request
    def log_every_view():
        if request.method != "GET":
            return
        path = request.path
        if path.startswith("/static"):
            return
        if path.startswith("/api/auth"):
            return
        if path == "/favicon.ico":
            return
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

    # Health endpoints
    @app.get("/")
    def index():
        return jsonify(status="ok", message="LePax backend root"), 200

    @app.get("/health")
    def health():
        return jsonify(status="ok", service="lepax-backend"), 200

    @app.get("/api/health")
    def api_health():
        return jsonify(status="ok", api="v1"), 200

    # Initialise DB and seed data
    with app.app_context():
        Base.metadata.create_all(bind=engine)
        seed_initial_data()

    return app


# -------------------------------------------------
# 3.  ENTRY POINT
# -------------------------------------------------
app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=True)
