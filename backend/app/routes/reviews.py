from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..auth import login_required
from ..db import db_session
from ..models import Order, OrderItem, OrderStatus, Review, UserRole, to_dict
from ..utils.sanitize import markdown_to_html

bp = Blueprint("reviews", __name__, url_prefix="/api")


@bp.get("/products/<product_id>/reviews")
def list_reviews(product_id: str):
    reviews = db_session.query(Review).filter_by(product_id=product_id).all()
    return jsonify({"reviews": [to_dict(review) for review in reviews]})


def _user_has_purchased(user_id: str, product_id: str) -> bool:
    return (
        db_session.query(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            Order.status.in_([OrderStatus.paid, OrderStatus.fulfilled, OrderStatus.refunded]),
        )
        .count()
        > 0
    )


@bp.post("/products/<product_id>/reviews")
@login_required()
def create_review(user, product_id: str):
    if not _user_has_purchased(user.id, product_id):
        return {"error": "review_not_allowed"}, 403
    data = request.get_json(force=True)
    body_md = data.get("body_md", "")
    review = Review(
        product_id=product_id,
        user_id=user.id,
        rating=int(data.get("rating", 5)),
        body_md=body_md,
        body_html_sanitised=markdown_to_html(body_md),
        images=data.get("images", []),
    )
    db_session.add(review)
    db_session.commit()
    return jsonify({"review": to_dict(review)})


@bp.patch("/reviews/<review_id>")
@login_required()
def update_review(user, review_id: str):
    review = db_session.get(Review, review_id)
    if not review or (review.user_id != user.id and user.role != UserRole.admin):
        return {"error": "not_found"}, 404
    data = request.get_json(force=True)
    if "body_md" in data:
        review.body_md = data["body_md"]
        review.body_html_sanitised = markdown_to_html(review.body_md)
    if "rating" in data:
        review.rating = int(data["rating"])
    db_session.add(review)
    db_session.commit()
    return jsonify({"review": to_dict(review)})


@bp.delete("/reviews/<review_id>")
@login_required()
def delete_review(user, review_id: str):
    review = db_session.get(Review, review_id)
    if not review or (review.user_id != user.id and user.role != UserRole.admin):
        return {"error": "not_found"}, 404
    db_session.delete(review)
    db_session.commit()
    return {"status": "deleted"}


@bp.post("/reviews/<review_id>/flag")
@login_required()
def flag_review(user, review_id: str):
    # In this scaffold we just acknowledge the flag.
    return {"status": "flagged", "review_id": review_id}


__all__ = ["bp"]
