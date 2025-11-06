from __future__ import annotations

from sqlalchemy import or_
from flask import Blueprint, jsonify, request

from ..db import db_session
from ..models import Product, ProductImage, Review, Variant, to_dict

bp = Blueprint("catalog", __name__, url_prefix="/api/products")


def serialize_product(product: Product) -> dict:
    data = to_dict(product)
    data["variants"] = [to_dict(v) for v in product.variants]
    data["images"] = [to_dict(i) for i in product.images]
    return data


@bp.get("")
def list_products():
    query = db_session.query(Product).filter_by(active=True)
    q = request.args.get("q")
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(Product.name.ilike(like), Product.brand.ilike(like), Product.category.ilike(like))
        )
    if brand := request.args.get("brand"):
        query = query.filter(Product.brand == brand)
    if category := request.args.get("category"):
        query = query.filter(Product.category == category)
    if colour := request.args.get("colour"):
        query = query.join(Product.variants).filter(Variant.colour == colour)
    if size := request.args.get("size"):
        query = query.join(Product.variants).filter(Variant.size == size)
    if request.args.get("price_min"):
        query = query.filter(Product.price_cents >= int(request.args["price_min"]))
    if request.args.get("price_max"):
        query = query.filter(Product.price_cents <= int(request.args["price_max"]))
    sort = request.args.get("sort", "recent")
    if sort == "price_asc":
        query = query.order_by(Product.price_cents.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price_cents.desc())
    else:
        query = query.order_by(Product.created_at.desc())
    page = int(request.args.get("page", 1))
    page_size = min(50, int(request.args.get("page_size", 12)))
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({"items": [serialize_product(p) for p in items], "page": page, "page_size": page_size})


@bp.get("/<product_id>")
def get_product(product_id: str):
    product = db_session.get(Product, product_id)
    if not product:
        return {"error": "not_found"}, 404
    reviews = db_session.query(Review).filter_by(product_id=product_id).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else None
    return jsonify({
        "product": serialize_product(product),
        "review_summary": {"count": len(reviews), "average": avg_rating},
        "reviews": [to_dict(r) for r in reviews],
    })


__all__ = ["bp"]
