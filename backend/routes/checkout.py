from flask import Blueprint, request, jsonify, g
from datetime import datetime

from backend.db.database import SessionLocal
from backend.models.models import Product, Order, OrderItem
from backend.security.rbac import require_login, require_role

bp = Blueprint("checkout", __name__)


@bp.post("/api/checkout")
@require_role("customer")
def checkout():
    """
    Fake payment checkout:
    - expects JSON: { "items": [{ "product_id": ..., "qty": ... }] }
    - validates products server side
    - creates an order with status 'paid'
    """
    data = request.get_json() or {}
    items = data.get("items") or []

    if not isinstance(items, list) or not items:
        return jsonify({"ok": False, "error": "No items supplied"}), 400

    db = SessionLocal()
    try:
        # Collect product IDs
        try:
            product_ids = {int(i["product_id"]) for i in items}
        except Exception:
            return jsonify({"ok": False, "error": "Invalid items"}), 400

        if not product_ids:
            return jsonify({"ok": False, "error": "Invalid items"}), 400

        # Fetch products (treat active as boolean if needed)
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .filter(
                Product.active == 1
            )  # change to .filter(Product.active.is_(True)) if Boolean
            .all()
        )
        products_by_id = {p.id: p for p in products}

        if not products_by_id:
            return jsonify({"ok": False, "error": "No active products found"}), 400

        if len(products_by_id) != len(product_ids):
            return jsonify(
                {"ok": False, "error": "One or more products not found"}
            ), 400

        # Assume same currency
        currency = products[0].currency

        total_cents = 0
        order_items: list[OrderItem] = []

        for raw in items:
            pid = int(raw["product_id"])
            qty = int(raw.get("qty", 1))

            if qty < 1:
                return jsonify(
                    {"ok": False, "error": "Quantity must be at least 1"}
                ), 400

            if pid not in products_by_id:
                return jsonify({"ok": False, "error": f"Product {pid} not found"}), 400

            prod = products_by_id[pid]
            total_cents += prod.price_cents * qty

            order_items.append(
                OrderItem(
                    product_id=prod.id,
                    qty=qty,
                    unit_price_cents=prod.price_cents,
                )
            )

        # If Order.created_at is DateTime, use datetime.utcnow()
        # If it is Integer, swap to int(datetime.utcnow().timestamp())
        now = datetime.utcnow()

        order = Order(
            user_id=g.current_user.id,
            total_cents=total_cents,
            currency=currency,
            status="paid",
            payment_provider="stub",
            provider_ref=f"demo-{int(now.timestamp())}",
            created_at=now,
        )

        db.add(order)
        db.flush()  # order.id available

        for oi in order_items:
            oi.order_id = order.id
            db.add(oi)

        db.commit()
        db.refresh(order)

        return jsonify(
            {
                "ok": True,
                "order": {
                    "id": order.id,
                    "total_cents": order.total_cents,
                    "currency": order.currency,
                    "status": order.status,
                    "created_at": order.created_at,
                    "items": [
                        {
                            "product_id": oi.product_id,
                            "qty": oi.qty,
                            "unit_price_cents": oi.unit_price_cents,
                        }
                        for oi in order_items
                    ],
                },
            }
        )
    finally:
        db.close()


@bp.get("/api/seller/transactions")
@require_role("seller")
def seller_transactions():
    db = SessionLocal()
    try:
        # join OrderItem -> Product -> Order
        q = (
            db.query(OrderItem, Product, Order)
            .join(Product, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Product.owner_id == g.current_user.id)
            .order_by(Order.created_at.desc())
        )

        rows = q.all()

        result = []
        for oi, prod, order in rows:
            result.append(
                {
                    "order_id": order.id,
                    "order_created_at": order.created_at,
                    "buyer_id": order.user_id,
                    "product_id": prod.id,
                    "product_name": prod.name,
                    "qty": oi.qty,
                    "unit_price_cents": oi.unit_price_cents,
                    "currency": order.currency,
                }
            )

        return jsonify({"ok": True, "transactions": result})
    finally:
        db.close()


@bp.get("/api/orders/me")
@require_login
def list_my_orders():
    db = SessionLocal()
    try:
        orders = (
            db.query(Order)
            .filter(Order.user_id == g.current_user.id)
            .order_by(Order.created_at.desc())
            .all()
        )

        order_ids = [o.id for o in orders]

        items: list[OrderItem] = []
        if order_ids:
            items = db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).all()

        items_by_order = {}
        for it in items:
            items_by_order.setdefault(it.order_id, []).append(it)

        return jsonify(
            {
                "ok": True,
                "orders": [
                    {
                        "id": o.id,
                        "total_cents": o.total_cents,
                        "currency": o.currency,
                        "status": o.status,
                        "created_at": o.created_at,
                        "items": [
                            {
                                "product_id": it.product_id,
                                "qty": it.qty,
                                "unit_price_cents": it.unit_price_cents,
                            }
                            for it in items_by_order.get(o.id, [])
                        ],
                    }
                    for o in orders
                ],
            }
        )
    finally:
        db.close()
