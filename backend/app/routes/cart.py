from __future__ import annotations

from flask import Blueprint, jsonify, request, session

from ..auth import get_current_user
from ..models import Product, Variant
from ..db import db_session

bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _get_cart() -> list[dict]:
    if "cart" not in session:
        session["cart"] = []
    return session["cart"]


@bp.get("")
def get_cart():
    cart = _get_cart()
    enriched = []
    for item in cart:
        product = db_session.get(Product, item["product_id"])
        variant = db_session.get(Variant, item["variant_id"]) if item.get("variant_id") else None
        enriched.append({"product": product.name if product else None, "variant": variant.size if variant else None, **item})
    return jsonify({"items": enriched})


@bp.post("")
def add_to_cart():
    payload = request.get_json(force=True)
    item = {
        "product_id": payload.get("product_id"),
        "variant_id": payload.get("variant_id"),
        "quantity": int(payload.get("quantity", 1)),
    }
    cart = _get_cart()
    cart.append(item)
    session["cart"] = cart
    return jsonify({"items": cart}), 201


@bp.patch("")
def update_cart():
    payload = request.get_json(force=True)
    session["cart"] = payload.get("items", [])
    return jsonify({"items": session["cart"]})


__all__ = ["bp"]
