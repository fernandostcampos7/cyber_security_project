from __future__ import annotations

import os
import secrets
import time
from functools import wraps
from typing import Any, Callable

import jwt
from argon2 import PasswordHasher
from flask import Blueprint, current_app, jsonify, request, session, url_for
from itsdangerous import URLSafeSerializer

from .db import db_session
from .models import Profile, User, UserRole
from .models import to_dict

ph = PasswordHasher()


def _token_payload(user: User, expires_in: int) -> dict[str, Any]:
    now = int(time.time())
    return {"sub": user.id, "role": user.role.value, "iat": now, "exp": now + expires_in}


def generate_tokens(user: User) -> dict[str, str]:
    secret = current_app.config["SECRET_KEY"]
    access_payload = _token_payload(user, expires_in=900)
    refresh_payload = _token_payload(user, expires_in=7 * 24 * 3600)
    return {
        "access_token": jwt.encode(access_payload, secret, algorithm="HS256"),
        "refresh_token": jwt.encode(refresh_payload, secret, algorithm="HS256"),
    }


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])


def get_current_user() -> User | None:
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    elif "access_token" in session:
        token = session.get("access_token")
    if not token:
        return None
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        return None
    return db_session.get(User, payload["sub"])


def login_required(role: UserRole | None = None) -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return {"error": "authentication_required"}, 401
            if role and user.role not in {role, UserRole.admin}:
                return {"error": "forbidden"}, 403
            return func(user, *args, **kwargs)

        return wrapper

    return decorator


bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _create_profile(user: User, display_name: str) -> None:
    profile = Profile(user_id=user.id, display_name=display_name, avatar_url="")
    db_session.add(profile)


@bp.post("/register")
def register():
    data = request.get_json(force=True)
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    display_name = data.get("display_name", "").strip() or email.split("@")[0]
    if not email or not password:
        return {"error": "email_and_password_required"}, 400
    if db_session.query(User).filter_by(email=email).first():
        return {"error": "email_taken"}, 400
    pw_hash = ph.hash(password)
    user = User(email=email, pw_hash=pw_hash, role=UserRole.customer)
    db_session.add(user)
    _create_profile(user, display_name)
    db_session.commit()
    tokens = generate_tokens(user)
    session["access_token"] = tokens["access_token"]
    session["refresh_token"] = tokens["refresh_token"]
    return jsonify({"user": to_dict(user, {"pw_hash"}), **tokens}), 201


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    user = db_session.query(User).filter_by(email=email).first()
    if not user:
        return {"error": "invalid_credentials"}, 401
    try:
        ph.verify(user.pw_hash, password)
    except Exception:
        return {"error": "invalid_credentials"}, 401
    tokens = generate_tokens(user)
    session["access_token"] = tokens["access_token"]
    session["refresh_token"] = tokens["refresh_token"]
    return jsonify({"user": to_dict(user, {"pw_hash"}), **tokens})


@bp.post("/logout")
def logout():
    session.clear()
    return {"message": "logged_out"}, 200


@bp.post("/refresh")
def refresh():
    token = request.json.get("refresh_token") if request.is_json else session.get("refresh_token")
    if not token:
        return {"error": "refresh_required"}, 401
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        return {"error": "invalid_token"}, 401
    user = db_session.get(User, payload["sub"])
    if not user:
        return {"error": "user_not_found"}, 404
    tokens = generate_tokens(user)
    session["access_token"] = tokens["access_token"]
    session["refresh_token"] = tokens["refresh_token"]
    return jsonify(tokens)


@bp.get("/me")
def me():
    user = get_current_user()
    if not user:
        return {"error": "authentication_required"}, 401
    profile = user.profile
    data = to_dict(user, {"pw_hash"})
    if profile:
        data["profile"] = to_dict(profile)
    return jsonify(data)


# OAuth placeholders
_oauth_state_serializer = URLSafeSerializer(os.getenv("SECRET_KEY", "changeme"))


def _oauth_redirect(provider: str) -> dict[str, str]:
    state = _oauth_state_serializer.dumps({"provider": provider, "nonce": secrets.token_hex(8)})
    session["oauth_state"] = state
    return {
        "auth_url": f"https://auth.{provider}.example/authorize?state={state}",
        "state": state,
    }


def _oauth_callback(provider: str):
    state = request.args.get("state")
    if not state or state != session.get("oauth_state"):
        return {"error": "invalid_state"}, 400
    email = f"demo_{provider}@lepax.test"
    user = db_session.query(User).filter_by(email=email).first()
    if not user:
        user = User(email=email, pw_hash=ph.hash(secrets.token_hex()), role=UserRole.customer)
        db_session.add(user)
        _create_profile(user, provider.title())
        db_session.commit()
    tokens = generate_tokens(user)
    session["access_token"] = tokens["access_token"]
    session["refresh_token"] = tokens["refresh_token"]
    return jsonify({"user": to_dict(user, {"pw_hash"}), **tokens})


@bp.get("/oauth/google/start")
def google_start():
    return jsonify(_oauth_redirect("google"))


@bp.get("/oauth/google/callback")
def google_callback():
    return _oauth_callback("google")


@bp.get("/oauth/facebook/start")
def facebook_start():
    return jsonify(_oauth_redirect("facebook"))


@bp.get("/oauth/facebook/callback")
def facebook_callback():
    return _oauth_callback("facebook")


__all__ = [
    "bp",
    "login_required",
    "get_current_user",
]
