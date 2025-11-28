import os
import smtplib
import ssl
from email.message import EmailMessage

from flask import Blueprint, request, session, jsonify, current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from backend.db.database import SessionLocal
from backend.models.models import User
from backend.security.passwords import hash_password, verify_password

bp = Blueprint("auth", __name__)


# -------------------------
# Helpers
# -------------------------


def _get_serializer() -> URLSafeTimedSerializer:
    """
    Create a URLSafeTimedSerializer using the app's SECRET_KEY.
    Used to sign and verify password-reset tokens.
    """
    secret_key = current_app.config.get("SECRET_KEY") or os.getenv("SECRET_KEY", "dev-secret")
    return URLSafeTimedSerializer(secret_key, salt="password-reset")


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """
    Send the password reset email.

    Uses basic SMTP with environment variables:
        MAIL_SERVER
        MAIL_PORT
        MAIL_USERNAME
        MAIL_PASSWORD
        MAIL_USE_TLS  (optional, "1" or "true")
        MAIL_FROM     (optional, default = MAIL_USERNAME)
    If not configured, logs the URL instead so you can still test locally.
    """
    mail_server = os.getenv("MAIL_SERVER")
    mail_port = int(os.getenv("MAIL_PORT", "587"))
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")
    mail_use_tls = os.getenv("MAIL_USE_TLS", "1").lower() in {"1", "true", "yes"}
    mail_from = os.getenv("MAIL_FROM") or mail_username

    subject = "Password reset instructions"
    body = (
        "You requested to reset your password.\n\n"
        f"Click the link below to choose a new password:\n\n{reset_url}\n\n"
        "If you did not request this, you can safely ignore this email."
    )

    if not (mail_server and mail_port and mail_username and mail_password and mail_from):
        # Fallback for development: just log the reset URL
        current_app.logger.warning(
            "Password reset email not sent because SMTP is not configured. "
            f"Reset URL for {to_email}: {reset_url}"
        )
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.set_content(body)

    context = ssl.create_default_context()

    try:
        with smtplib.SMTP(mail_server, mail_port) as server:
            if mail_use_tls:
                server.starttls(context=context)
            server.login(mail_username, mail_password)
            server.send_message(msg)
    except Exception as exc:
        current_app.logger.error(f"Error sending password reset email: {exc}")


# -------------------------
# Existing endpoints
# -------------------------


@bp.post("/api/auth/register")
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Missing fields"}, 400

    db = SessionLocal()
    try:
        # check existing
        if db.query(User).filter_by(email=email).first():
            return {"error": "email exists"}, 409

        user = User(
            email=email,
            password_hash=hash_password(password),
            role="customer",
        )
        db.add(user)
        db.commit()
        return {"ok": True}, 201
    finally:
        db.close()


@bp.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not email or not password:
            return {"error": "Missing email or password"}, 400

        session["user_id"] = user.id

        return jsonify(
            ok=True,
            user={
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
        )
    finally:
        db.close()


@bp.post("/api/auth/logout")
def logout():
    session.clear()
    return {"ok": True}


# -------------------------
# New: Forgot password
# -------------------------


@bp.post("/api/auth/forgot-password")
def forgot_password():
    """
    Request a password reset link.

    Body: { "email": "user@example.com" }

    Always returns ok (if format is valid) so attackers cannot enumerate emails.
    """
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return {"error": "email is required"}, 400

    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()

        if user:
            # Generate signed token with user_id and email
            s = _get_serializer()
            token = s.dumps({"user_id": user.id, "email": user.email})

            # Where your frontend reset form lives
            frontend_base = (
                current_app.config.get("FRONTEND_BASE_URL")
                or os.getenv("FRONTEND_BASE_URL")
                or "http://localhost:5173"
            )
            reset_url = f"{frontend_base}/reset-password?token={token}"

            send_password_reset_email(user.email, reset_url)

        # Do not reveal whether the email exists
        return {"ok": True}
    finally:
        db.close()


# -------------------------
# New: Reset password
# -------------------------


@bp.post("/api/auth/reset-password")
def reset_password():
    """
    Reset password given a valid token.

    Body: { "token": "<token-from-email>", "password": "new-password" }
    """
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return {"error": "token and password are required"}, 400

    s = _get_serializer()
    try:
        payload = s.loads(token, max_age=60 * 60 * 2)  # 2 hours
    except SignatureExpired:
        return {"error": "reset token has expired"}, 400
    except BadSignature:
        return {"error": "invalid reset token"}, 400

    user_id = payload.get("user_id")

    db = SessionLocal()
    try:
        user = db.query(User).get(user_id)
        if not user:
            return {"error": "user not found"}, 404

        user.password_hash = hash_password(new_password)
        db.commit()
        return {"ok": True}
    finally:
        db.close()
