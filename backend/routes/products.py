from flask import Blueprint, request, jsonify
from sqlalchemy import text
from backend.db.database import SessionLocal
from backend.models.models import Product
from backend.security.analytics import log_interaction

bp = Blueprint("products", __name__)


@bp.get("/api/products")
def list_products():
    args = {
        "q": request.args.get("q"),
        "brand": request.args.get("brand"),
        "category": request.args.get("category"),
        "size": request.args.get("size"),
        "colour": request.args.get("colour"),
        "min_price": request.args.get("min_price", type=int),
        "max_price": request.args.get("max_price", type=int),
        "sort": request.args.get("sort", "newest"),
        "limit": min(max(request.args.get("limit", default=12, type=int), 1), 50),
        "page": max(request.args.get("page", default=1, type=int), 1),
    }
    offset = (args["page"] - 1) * args["limit"]

    text_query_raw = args["q"]
    text_query = text_query_raw.strip() if text_query_raw else ""

    brand_raw = args["brand"]
    brand = brand_raw.strip() if brand_raw else ""

    category_raw = args["category"]
    category = category_raw.strip() if category_raw else ""

    # ORDERING...
    order_sql_map = {
        "newest": "p.created_at DESC",
        "price_asc": "p.price_cents ASC",
        "price_desc": "p.price_cents DESC",
    }
    order_sql = order_sql_map.get(args["sort"], "p.created_at DESC")

    where_clauses = ["p.active = 1"]
    sql_params: dict[str, object] = {
        "limit": args["limit"],
        "offset": offset,
    }

    # BRAND (case insensitive)
    if brand:
        where_clauses.append("LOWER(p.brand) = LOWER(:brand)")
        sql_params["brand"] = brand

    # CATEGORY (case insensitive)
    if category:
        where_clauses.append("LOWER(p.category) = LOWER(:category)")
        sql_params["category"] = category

    # PRICE RANGE
    if args["min_price"] is not None:
        where_clauses.append("p.price_cents >= :min_price")
        sql_params["min_price"] = args["min_price"]

    if args["max_price"] is not None:
        where_clauses.append("p.price_cents <= :max_price")
        sql_params["max_price"] = args["max_price"]

    # SIZE / COLOUR via variants
    if args["size"]:
        where_clauses.append(
            "EXISTS (SELECT 1 FROM variants v "
            "WHERE v.product_id = p.id AND v.size = :size AND v.stock > 0)"
        )
        sql_params["size"] = args["size"]

    # note: args["colour"], not "color"
    if args["colour"]:
        where_clauses.append(
            "EXISTS (SELECT 1 FROM variants v2 "
            "WHERE v2.product_id = p.id AND v2.colour = :colour AND v2.stock > 0)"
        )
        sql_params["colour"] = args["colour"]

    # SIMPLE TEXT SEARCH (no FTS, just LIKE)
    from_clause = "FROM products p"

    if text_query:
        where_clauses.append("(p.name LIKE :q_like OR p.description_md LIKE :q_like)")
        sql_params["q_like"] = f"%{text_query}%"

    where_sql = " AND ".join(where_clauses)

    items_sql = text(
        f"""
        SELECT
            p.id,
            p.name,
            p.brand,
            p.category,
            p.price_cents,
            p.currency,
            p.hero_image_url
        {from_clause}
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT :limit OFFSET :offset
        """
    )

    count_sql = text(
        f"""
        SELECT COUNT(*)
        {from_clause}
        WHERE {where_sql}
        """
    )

    db = SessionLocal()
    try:
        total = db.execute(count_sql, sql_params).scalar_one()
        rows = db.execute(items_sql, sql_params).mappings().all()

        return jsonify(
            {
                "items": [dict(r) for r in rows],
                "total": total,
                "page": args["page"],
                "limit": args["limit"],
                "debug_marker": "products_list_v3",
            }
        )
    finally:
        db.close()


@bp.get("/api/products/<int:product_id>")
def get_product(product_id: int):
    # Step 4 — log product view
    log_interaction("product_view", f"product_id={product_id}")

    db = SessionLocal()
    try:
        product = db.query(Product).filter_by(id=product_id).first()
        if not product:
            return jsonify(error="Product not found"), 404

        return jsonify(
            id=product.id,
            name=product.name,
            brand=product.brand,
            category=product.category,
            description_md=product.description_md,
            price_cents=product.price_cents,
            currency=product.currency,
            hero_image_url=product.hero_image_url,
            created_at=product.created_at.isoformat() if product.created_at else None,
        ), 200
    finally:
        db.close()
