from flask import Blueprint, jsonify, g
from backend.db.database import SessionLocal
from backend.models.models import Order, OrderItem, Product
# from backend.security.rbac import require_role   # ← not used here any more

bp = Blueprint("orders", __name__)


@bp.get("/api/orders/my")
def my_orders():
    """
    Return orders for the current user, with basic line items.

    Access control:
      - requires an authenticated user
      - only role 'customer' is allowed (for now)
    """
    db = SessionLocal()
    try:
        user = getattr(g, "current_user", None)

        # 1) Must be logged in
        if not user:
            return (
                jsonify(
                    {
                        "ok": False,
                        "error": "Authentication required to view your orders.",
                    }
                ),
                401,
            )

        # 2) Must have the right role
        user_role = (getattr(user, "role", "") or "").strip().lower()
        if user_role != "customer":
            # This is what is currently causing the 403
            # Returning the role in the message helps you see what Render is storing.
            return (
                jsonify(
                    {
                        "ok": False,
                        "error": f"Access denied: your role '{user_role}' "
                        "is not allowed to view customer orders.",
                    }
                ),
                403,
            )

        # 3) Explicit joins: Order -> OrderItem -> Product
        rows = (
            db.query(Order, OrderItem, Product)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, OrderItem.product_id == Product.id)
            .filter(Order.user_id == user.id)
            .order_by(getattr(Order, "created_at", Order.id).desc())
            .all()
        )

        # 4) Group rows by order id
        orders_by_id: dict[int, dict] = {}
        for order, item, product in rows:
            if order.id not in orders_by_id:
                orders_by_id[order.id] = {
                    "id": order.id,
                    "total_cents": getattr(order, "total_cents", 0),
                    "currency": getattr(order, "currency", "GBP"),
                    "status": getattr(order, "status", "unknown"),
                    "created_at": getattr(order, "created_at", None),
                    "items": [],
                }

            orders_by_id[order.id]["items"].append(
                {
                    "product_id": item.product_id,
                    "product_name": getattr(product, "name", None),
                    "product_brand": getattr(product, "brand", None),
                    "product_image_url": getattr(product, "hero_image_url", None),
                    "qty": item.qty,
                    "unit_price_cents": getattr(item, "unit_price_cents", 0),
                    "currency": getattr(order, "currency", "GBP"),
                }
            )

        # 5) Always return a consistent shape
        return jsonify({"ok": True, "orders": list(orders_by_id.values())}), 200

    except Exception as e:
        db.rollback()
        import traceback

        traceback.print_exc()
        print("ERROR in /api/orders/my:", repr(e))
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "Failed to load orders on the server",
                }
            ),
            500,
        )
    finally:
        db.close()
