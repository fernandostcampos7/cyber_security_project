from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..auth import login_required
from ..db import db_session
from ..models import (
    OrderItem,
    Product,
    ProductImage,
    SellerApplication,
    UserRole,
    Variant,
    to_dict,
)

bp = Blueprint("seller", __name__, url_prefix="/api/seller")


@bp.post("/apply")
@login_required()
def apply(user):
    existing = db_session.query(SellerApplication).filter_by(user_id=user.id).first()
    if existing:
        return jsonify({"application": to_dict(existing)})
    application = SellerApplication(user_id=user.id)
    db_session.add(application)
    db_session.commit()
    return jsonify({"application": to_dict(application)})


@bp.post("/products")
@login_required(UserRole.seller)
def create_product(user):
    data = request.get_json(force=True)
    product = Product(
        owner_id=user.id,
        sku=data.get("sku"),
        name=data.get("name"),
        brand=data.get("brand", ""),
        category=data.get("category", ""),
        description_md=data.get("description_md", ""),
        price_cents=int(data.get("price_cents", 0)),
        seo_slug=data.get("seo_slug", data.get("name", "").lower().replace(" ", "-")),
        hero_image_url=data.get("hero_image_url", ""),
    )
    db_session.add(product)
    db_session.commit()
    for image_url in data.get("images", []):
        db_session.add(ProductImage(product_id=product.id, url=image_url))
    for variant_payload in data.get("variants", []):
        db_session.add(
            Variant(
                product_id=product.id,
                size=variant_payload.get("size"),
                colour=variant_payload.get("colour"),
                stock=int(variant_payload.get("stock", 0)),
                gtin=variant_payload.get("gtin"),
            )
        )
    db_session.commit()
    return jsonify({"product": to_dict(product)})


@bp.patch("/products/<product_id>")
@login_required(UserRole.seller)
def update_product(user, product_id: str):
    product = db_session.get(Product, product_id)
    if not product or (product.owner_id not in {user.id, None} and user.role != UserRole.admin):
        return {"error": "not_found"}, 404
    data = request.get_json(force=True)
    for field in ["name", "brand", "category", "description_md", "price_cents", "hero_image_url"]:
        if field in data:
            setattr(product, field, data[field])
    db_session.add(product)
    db_session.commit()
    return jsonify({"product": to_dict(product)})


@bp.delete("/products/<product_id>")
@login_required(UserRole.seller)
def delete_product(user, product_id: str):
    product = db_session.get(Product, product_id)
    if not product or product.owner_id != user.id:
        return {"error": "not_found"}, 404
    db_session.delete(product)
    db_session.commit()
    return {"status": "deleted"}


@bp.get("/transactions")
@login_required(UserRole.seller)
def transactions(user):
    items = (
        db_session.query(OrderItem)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(Product.owner_id == user.id)
        .all()
    )
    return jsonify({"transactions": [to_dict(item) for item in items]})


__all__ = ["bp"]
