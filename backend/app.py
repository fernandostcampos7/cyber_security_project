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
# 1.  AUTO-SEEDING HELPERS
# -------------------------------------------------
def seed_initial_data():
    """Create default users and demo products if database is empty."""
    db = SessionLocal()
    try:
        # Seed users only if no users exist
        if db.query(User).count() == 0:
            pw = hash_password("Test1234!")
            users = [
                User(email="admin@example.com", role="admin", password_hash=pw),
                User(email="buyer@example.com", role="customer", password_hash=pw),
                User(email="seller@example.com", role="seller", password_hash=pw),
            ]
            db.add_all(users)
            db.commit()
            print("✅ Default users seeded.")

        # Seed a few demo products if none exist
        if db.query(Product).count() == 0:
            demo_products = [
                Product(
                    owner_id=None,
                    sku="SKU-DEMO-001",
                    name="Aurora Leather Tote",
                    brand="Maison Luma",
                    category="Bags",
                    description_md="Minimalist calf-leather tote with reinforced stitching.",
                    price_cents=45000,
                    currency="GBP",
                    active=True,
                    seo_slug="aurora-leather-tote",
                    hero_image_url="https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg?w=800",
                ),
                Product(
                    owner_id=None,
                    sku="SKU-DEMO-002",
                    name="Midnight Trench Coat",
                    brand="Noir Atelier",
                    category="Coats",
                    description_md="Structured trench coat crafted for all-year elegance.",
                    price_cents=69000,
                    currency="GBP",
                    active=True,
                    seo_slug="midnight-trench-coat",
                    hero_image_url="https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?w=800",
                ),
            ]
            db.add_all(demo_products)
            db.commit()
            print("✅ Demo products seeded.")

    except Exception as e:
        db.rollback()
        print(f"⚠️  Seeding error: {e}")
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

    # Security headers
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

    # Log every GET view
    @app.before_request
    def log_every_view():
        if request.method != "GET" or request.path.startswith(("/api/auth", "/static")):
            return
        log_view(path=request.path, product_id=None)

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
