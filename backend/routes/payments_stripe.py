import stripe
from stripe import error as stripe_error
from flask import Blueprint, request, jsonify, current_app, g

from backend.db.database import SessionLocal
from backend.models.models import Product, Order, OrderItem
from backend.security.rbac import require_role


bp = Blueprint("stripe_payments", __name__)


@bp.before_app_request
def load_stripe_key():
    api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if api_key:
        stripe.api_key = api_key
    else:
        current_app.logger.warning("STRIPE_SECRET_KEY is not configured")


@bp.route("/api/payments/stripe/create-intent", methods=["POST"])
@require_role("customer", "seller", "admin")
def create_stripe_intent():
    data = request.get_json() or {}
    items = data.get("items")

    if not items or not isinstance(items, list):
        return jsonify({"ok": False, "error": "items must be a non empty list"}), 400

    try:
        product_ids = {int(item["product_id"]) for item in items if "product_id" in item}
    except (KeyError, TypeError, ValueError):
        return jsonify({"ok": False, "error": "invalid product_id in items"}), 400

    if not product_ids:
        return jsonify({"ok": False, "error": "no product_ids provided"}), 400

    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        products_by_id = {p.id: p for p in products}

        missing = product_ids - products_by_id.keys()
        if missing:
            return (
                jsonify(
                    {
                        "ok": False,
                        "error": f"unknown product ids: {sorted(missing)}",
                    }
                ),
                400,
            )

        total_cents = 0
        order_items = []

        for item in items:
            try:
                pid = int(item["product_id"])
                qty = int(item.get("quantity", 1))
            except (KeyError, TypeError, ValueError):
                return jsonify({"ok": False, "error": "invalid item payload"}), 400

            if qty <= 0:
                return jsonify({"ok": False, "error": "quantity must be at least 1"}), 400

            product = products_by_id[pid]

            # Each product already stores price in pence
            unit_price_cents = product.price_cents
            line_total_cents = unit_price_cents * qty
            total_cents += line_total_cents

            order_item = OrderItem(
                product_id=pid,
                qty=qty,
                unit_price_cents=unit_price_cents,
            )
            order_items.append(order_item)

        if total_cents <= 0:
            return jsonify({"ok": False, "error": "total must be greater than zero"}), 400

        # Create order (matches your schema)
        order = Order(
            user_id=g.current_user.id,   # <-- fix here
            total_cents=total_cents,
            currency="£",
            status="created",
            payment_provider="stripe",
            provider_ref=None,
        )
        db.add(order)
        db.flush()

        for oi in order_items:
            oi.order_id = order.id
            db.add(oi)

        # Create PaymentIntent in Stripe
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency="gbp",
            metadata={
                "order_id": str(order.id),
                "user_id": str(g.current_user.id),
            },
        )

        order.provider_ref = intent.id
        db.commit()

        return (
            jsonify(
                {
                    "ok": True,
                    "client_secret": intent.client_secret,
                    "order_id": order.id,
                }
            ),
            200,
        )

    except Exception as exc:
        db.rollback()
        current_app.logger.exception("Error creating Stripe PaymentIntent: %s", exc)
        return jsonify({"ok": False, "error": "failed to create payment intent"}), 500
    finally:
        db.close()


@bp.route("/webhooks/stripe", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET")

    if not endpoint_secret:
        current_app.logger.error("STRIPE_WEBHOOK_SECRET is not configured")
        return "Webhook secret not configured", 500

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret,
        )
    except ValueError:
        return "Invalid payload", 400
    except stripe_error.SignatureVerificationError:
        return "Invalid signature", 400

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        intent_id = intent["id"]

        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.provider_ref == intent_id).one_or_none()

            if order:
                order.status = "paid"
                db.commit()
            else:
                current_app.logger.warning(
                    "Stripe webhook: no order found for intent %s",
                    intent_id,
                )
        except Exception as exc:
            db.rollback()
            current_app.logger.exception(
                "Failed to update order on payment_intent.succeeded: %s", exc
            )
        finally:
            db.close()

    return jsonify({"received": True}), 200
