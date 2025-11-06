from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..auth import login_required
from ..db import db_session
from ..models import AuditLog, Order, Product, SellerApplication, User, UserRole, to_dict

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _ensure_admin(user):
    if user.role != UserRole.admin:
        return {"error": "forbidden"}, 403


@bp.get("/orders")
@login_required(UserRole.admin)
def admin_orders(user):
    orders = db_session.query(Order).all()
    return jsonify({"orders": [to_dict(o) for o in orders]})


@bp.get("/users")
@login_required(UserRole.admin)
def admin_users(user):
    users = db_session.query(User).all()
    return jsonify({"users": [to_dict(u, {"pw_hash"}) for u in users]})


@bp.patch("/users/<user_id>")
@login_required(UserRole.admin)
def admin_update_user(admin_user, user_id: str):
    target = db_session.get(User, user_id)
    if not target:
        return {"error": "not_found"}, 404
    data = request.get_json(force=True)
    if "role" in data:
        target.role = UserRole(data["role"])
    db_session.add(target)
    db_session.add(AuditLog(actor_id=admin_user.id, action="update_user", entity_type="user", entity_id=target.id, metadata=data))
    db_session.commit()
    return jsonify({"user": to_dict(target, {"pw_hash"})})


@bp.post("/products")
@login_required(UserRole.admin)
def admin_create_product(admin_user):
    data = request.get_json(force=True)
    product = Product(
        owner_id=None,
        sku=data.get("sku"),
        name=data.get("name"),
        brand=data.get("brand", "LePax"),
        category=data.get("category", "General"),
        description_md=data.get("description_md", ""),
        price_cents=int(data.get("price_cents", 0)),
        seo_slug=data.get("seo_slug", data.get("name", "").lower().replace(" ", "-")),
        hero_image_url=data.get("hero_image_url", ""),
    )
    db_session.add(product)
    db_session.add(AuditLog(actor_id=admin_user.id, action="create_product", entity_type="product", entity_id=product.id, metadata={"sku": product.sku}))
    db_session.commit()
    return jsonify({"product": to_dict(product)})


@bp.get("/logs")
@login_required(UserRole.admin)
def admin_logs(user):
    logs = db_session.query(AuditLog).order_by(AuditLog.occurred_at.desc()).limit(100).all()
    return jsonify({"logs": [to_dict(log) for log in logs]})


@bp.get("/analytics/summary")
@login_required(UserRole.admin)
def analytics_summary(user):
    total_orders = db_session.query(Order).count()
    total_users = db_session.query(User).count()
    return jsonify({"orders": total_orders, "users": total_users})


@bp.patch("/seller-applications/<application_id>")
@login_required(UserRole.admin)
def review_seller_application(admin_user, application_id: str):
    application = db_session.get(SellerApplication, application_id)
    if not application:
        return {"error": "not_found"}, 404
    data = request.get_json(force=True)
    application.status = data.get("status", application.status)
    application.note = data.get("note", application.note)
    application.decided_by = admin_user.id
    db_session.add(application)
    db_session.add(AuditLog(actor_id=admin_user.id, action="review_seller_application", entity_type="seller_application", entity_id=application.id, metadata=data))
    db_session.commit()
    return jsonify({"application": to_dict(application)})


__all__ = ["bp"]
