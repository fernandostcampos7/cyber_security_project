from flask import Blueprint, jsonify, request, g
from sqlalchemy import desc

from backend.db.database import SessionLocal
from backend.models.models import Review, Product, Order, OrderItem
from backend.security.markdown_sanitiser import md_to_safe_html
from backend.security.rbac import require_role
from sqlalchemy.exc import IntegrityError


bp = Blueprint("reviews", __name__)


@bp.post("/api/products/<int:product_id>/reviews")
@require_role("customer", "seller", "admin")
def create_review(product_id: int):
    data = request.get_json(silent=True) or {}
    rating = data.get("rating")
    body_md = (data.get("body") or "").strip()

    if rating is None or body_md == "":
        return jsonify(error="Missing rating or body"), 400

    try:
        rating = int(rating)
    except ValueError:
        return jsonify(error="Rating must be an integer"), 400

    if rating < 1 or rating > 5:
        return jsonify(error="Rating must be between 1 and 5"), 400

    db = SessionLocal()
    try:
        # 1. Product exists
        product = db.query(Product).filter_by(id=product_id).first()
        if not product:
            return jsonify(error="Product not found"), 404

        # 2. Enforce “only after purchase”
        # Adjust these allowed statuses if your DB uses something else
        allowed_statuses = ["paid", "PAID", "completed", "COMPLETED"]

        has_purchased = (
            db.query(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                Order.user_id == g.current_user.id,
                Order.status.in_(allowed_statuses),
                OrderItem.product_id == product_id,
            )
            .first()
            is not None
        )

        if not has_purchased:
            return (
                jsonify(
                    ok=False,
                    error="You can only review products you have purchased.",
                ),
                403,
            )

        # 3. Sanitise markdown, keep your existing fields
        body_html = md_to_safe_html(body_md)

        review = Review(
            product_id=product_id,
            user_id=g.current_user.id,
            rating=rating,
            body_md=body_md,
            body_html_sanitised=body_html,
            images=None,  # or "[]" if your column is a JSON string
        )

        try:
            db.add(review)
            db.commit()
            db.refresh(review)
        except IntegrityError:
            db.rollback()
            return (
                jsonify(
                    ok=False,
                    error="You have already reviewed this product.",
                    code="REVIEW_ALREADY_EXISTS",
                ),
                400,
            )

        return jsonify(
            ok=True,
            review={
                "id": review.id,
                "product_id": review.product_id,
                "user_id": review.user_id,
                "rating": review.rating,
                "body_html": review.body_html_sanitised,
                "created_at": review.created_at.isoformat()
                if review.created_at
                else None,
            },
        ), 201
    finally:
        db.close()


@bp.get("/api/products/<int:product_id>/reviews")
def list_reviews(product_id: int):
    db = SessionLocal()
    try:
        reviews = (
            db.query(Review)
            .filter_by(product_id=product_id)
            .order_by(desc(Review.created_at))
            .all()
        )

        payload = [
            {
                "id": r.id,
                "product_id": r.product_id,
                "user_id": r.user_id,
                "rating": r.rating,
                "body_html": r.body_html_sanitised,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ]

        # NEW: decide if the current user is allowed to review
        user = getattr(g, "current_user", None)
        can_review = False

        if user is not None:
            allowed_statuses = ["paid", "PAID", "completed", "COMPLETED"]

            has_purchased = (
                db.query(OrderItem)
                .join(Order, OrderItem.order_id == Order.id)
                .filter(
                    Order.user_id == user.id,
                    Order.status.in_(allowed_statuses),
                    OrderItem.product_id == product_id,
                )
                .first()
                is not None
            )

            has_reviewed = (
                db.query(Review.id)
                .filter(
                    Review.product_id == product_id,
                    Review.user_id == user.id,
                )
                .first()
                is not None
            )

            can_review = has_purchased and not has_reviewed

        return jsonify(
            reviews=payload,
            can_review=can_review,
        ), 200

    finally:
        db.close()


@bp.delete("/api/reviews/<int:review_id>")
@require_role("customer", "seller", "admin")
def delete_review(review_id: int):
    db = SessionLocal()
    try:
        review = db.query(Review).filter_by(id=review_id).first()
        if not review:
            return jsonify(error="Review not found"), 404

        user = g.current_user

        # Only the author or an admin can delete
        if user.role != "admin" and review.user_id != user.id:
            return jsonify(error="You can only delete your own reviews"), 403

        db.delete(review)
        db.commit()

        return jsonify(ok=True), 200
    finally:
        db.close()
