from datetime import datetime
from flask import Blueprint, jsonify, request, g
from backend.db.database import SessionLocal
from backend.models.models import Product, OrderItem, Order
from backend.security.rbac import require_role

bp = Blueprint("seller", __name__)


def _product_to_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "brand": p.brand,
        "category": p.category,
        "description_md": p.description_md,
        "price_cents": p.price_cents,
        "currency": p.currency,
        "active": bool(p.active),
        "hero_image_url": p.hero_image_url,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@bp.get("/api/seller/products")
@require_role("seller", "admin")
def list_my_products():
    """
    List products for the current seller or admin.

    - Sellers: only see their own products (owner_id = user.id)
    - Admins: see all products
    - Always returns 200 with { ok: True, items: [...] } on success
    """
    db = SessionLocal()
    try:
        user = g.current_user

        # Base query: newest first
        q = db.query(Product).order_by(Product.created_at.desc())

        # Optional: filter by active flag if you send ?active=true/false
        active_param = request.args.get("active")
        if active_param is not None:
            value = active_param.strip().lower()
            if value in ("1", "true", "yes"):
                q = q.filter(Product.active.is_(True))
            elif value in ("0", "false", "no"):
                q = q.filter(Product.active.is_(False))

        # Sellers only see their own stock
        if user.role == "seller":
            q = q.filter(Product.owner_id == user.id)

        # Admins fall through and see everything
        products = q.all()

        items = []
        for p in products:
            items.append(
                {
                    "id": p.id,
                    "sku": p.sku,
                    "name": p.name,
                    "brand": p.brand,
                    "category": p.category,
                    "description_md": p.description_md,
                    "price_cents": p.price_cents,
                    "currency": p.currency,
                    "active": p.active,
                    "hero_image_url": p.hero_image_url,
                    "created_at": (
                        p.created_at.isoformat()
                        if getattr(p, "created_at", None) is not None
                        else None
                    ),
                }
            )

        return jsonify(ok=True, items=items), 200
    finally:
        db.close()


@bp.post("/api/seller/products")
@require_role("seller")
def create_product():
    """
    Create a new product owned by the current seller.
    Minimal validation, enough for coursework.
    """
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    brand = (data.get("brand") or "").strip()
    category = (data.get("category") or "").strip()
    description_md = (data.get("description_md") or "").strip()
    currency = (data.get("currency") or "£").strip().upper()

    # raw price may come from "price_cents" or "price"
    price_raw = data.get("price_cents")
    if price_raw is None:
        price_raw = data.get("price")

    if not name or not brand or not category:
        return jsonify(ok=False, error="Name, brand and category are required"), 400

    if price_raw is None:
        return jsonify(ok=False, error="Price is required"), 400

    try:
        # allow either cents or numeric price in major units
        if isinstance(price_raw, str):
            if "." in price_raw:
                price_cents = int(round(float(price_raw) * 100))
            else:
                price_cents = int(price_raw)
        else:
            # assume numeric (int/float)
            price_cents = int(round(float(price_raw) * 100))
    except (TypeError, ValueError):
        return jsonify(ok=False, error="Invalid price"), 400

    db = SessionLocal()
    try:
        user = g.current_user
        now = datetime.utcnow()

        # very simple SKU generator, good enough for this project
        sku = f"SELL-{user.id}-{int(now.timestamp())}"

        product = Product(
            owner_id=user.id,
            sku=sku,
            name=name,
            brand=brand,
            category=category,
            description_md=description_md,
            price_cents=price_cents,
            currency=currency,
            active=True,  # boolean, not 1/0
            hero_image_url=data.get("hero_image_url"),
            created_at=now,
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        return jsonify(ok=True, item=_product_to_dict(product)), 201
    finally:
        db.close()


@bp.patch("/api/seller/products/<int:product_id>")
@require_role("seller")
def update_product(product_id: int):
    """
    Update a product, but only if it belongs to the current seller.
    """
    data = request.get_json(silent=True) or {}
    db = SessionLocal()
    try:
        user = g.current_user
        product = (
            db.query(Product)
            .filter(Product.id == product_id, Product.owner_id == user.id)
            .first()
        )
        if not product:
            return jsonify(ok=False, error="Product not found"), 404

        # Optional updates
        for field in ["name", "brand", "category", "description_md", "hero_image_url"]:
            if field in data and isinstance(data[field], str):
                setattr(product, field, data[field].strip())

        if "currency" in data and isinstance(data["currency"], str):
            product.currency = data["currency"].strip().upper()

        if "price_cents" in data or "price" in data:
            price_raw = data.get("price_cents")
            if price_raw is None:
                price_raw = data.get("price")

            if price_raw is None:
                return jsonify(ok=False, error="Invalid price"), 400

            try:
                if isinstance(price_raw, str):
                    if "." in price_raw:
                        product.price_cents = int(round(float(price_raw) * 100))
                    else:
                        product.price_cents = int(price_raw)
                else:
                    product.price_cents = int(round(float(price_raw) * 100))
            except (TypeError, ValueError):
                return jsonify(ok=False, error="Invalid price"), 400

        if "active" in data:
            # convert any truthy / falsy JSON value to a proper bool
            product.active = bool(data["active"])

        db.commit()
        db.refresh(product)
        return jsonify(ok=True, item=_product_to_dict(product))
    finally:
        db.close()


@bp.delete("/api/seller/products/<int:product_id>")
@require_role("seller")
def delete_product(product_id: int):
    """
    Delete a product owned by the current seller.
    For the coursework a hard delete is acceptable.
    """
    db = SessionLocal()
    try:
        user = g.current_user
        product = (
            db.query(Product)
            .filter(Product.id == product_id, Product.owner_id == user.id)
            .first()
        )
        if not product:
            return jsonify(ok=False, error="Product not found"), 404

        db.delete(product)
        db.commit()
        return jsonify(ok=True)
    finally:
        db.close()


@bp.get("/api/seller/transactions")
@require_role("seller")
def seller_transactions():
    """
    Transaction history for this seller's products.
    """
    db = SessionLocal()
    try:
        user = g.current_user

        q = (
            db.query(OrderItem, Order, Product)
            .join(Order, OrderItem.order_id == Order.id)
            .join(Product, OrderItem.product_id == Product.id)
            .filter(Product.owner_id == user.id)
            .order_by(Order.created_at.desc())
        )

        rows = q.all()
        result = []
        for item, order, product in rows:
            result.append(
                {
                    "order_id": order.id,
                    "order_status": order.status,
                    "order_created_at": order.created_at,
                    "product_id": product.id,
                    "product_name": product.name,
                    "qty": item.qty,
                    "unit_price_cents": item.unit_price_cents,
                    "total_line_cents": item.unit_price_cents * item.qty,
                }
            )

        return jsonify(ok=True, transactions=result)
    finally:
        db.close()
