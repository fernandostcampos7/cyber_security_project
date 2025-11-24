from __future__ import annotations

import logging
from flask import Blueprint, jsonify, request

from ..auth import login_required
from ..db import db_session
from ..models import Order, OrderStatus, to_dict
from ..payments import paypal, stripe

bp = Blueprint("webhooks", __name__)
logger = logging.getLogger(__name__)


@bp.post("/api/checkout/session")
@login_required()
def create_checkout_session(user):
    data = request.get_json(force=True)
    amount_cents = int(data.get("amount_cents", 0))
    currency = data.get("currency", "EUR")
    provider = data.get("provider", "stripe")
    if provider == "paypal":
        order = paypal.create_order(amount_cents, currency)
        db_order = Order(
            user_id=user.id,
            total_cents=amount_cents,
            currency=currency,
            status=OrderStatus.created,
            payment_provider="paypal",
            provider_ref=order.id,
        )
        db_session.add(db_order)
        db_session.commit()
        return jsonify({"paypal_order": order.id, "order": to_dict(db_order)})
    else:
        session_info = stripe.create_payment_session(amount_cents, currency, user.email)
        db_order = Order(
            user_id=user.id,
            total_cents=amount_cents,
            currency=currency,
            status=OrderStatus.created,
            payment_provider="stripe",
            provider_ref=session_info.payment_intent,
        )
        db_session.add(db_order)
        db_session.commit()
        return jsonify({"client_secret": session_info.client_secret, "order": to_dict(db_order)})


@bp.post("/api/webhooks/stripe")
def stripe_webhook():
    payload = request.get_data()
    signature = request.headers.get("Stripe-Signature", "")
    secret = request.headers.get("Stripe-Webhook-Secret", "")
    if not stripe.verify_webhook_signature(payload, signature, secret):
        return {"error": "invalid_signature"}, 400
    event = request.get_json(force=True)
    intent_id = event.get("data", {}).get("object", {}).get("id")
    if not intent_id:
        return {"status": "ignored"}
    order = db_session.query(Order).filter_by(provider_ref=intent_id).first()
    if not order:
        logger.warning("Stripe webhook for unknown intent", extra={"intent": intent_id})
        return {"status": "unknown_order"}, 202
    if order.status != OrderStatus.paid:
        order.status = OrderStatus.paid
        db_session.add(order)
        db_session.commit()
    return {"status": "ok"}


@bp.post("/api/webhooks/paypal")
def paypal_webhook():
    payload = request.get_data()
    headers = {k: v for k, v in request.headers.items()}
    if not paypal.verify_webhook(payload, headers):
        return {"error": "invalid_signature"}, 400
    event = request.get_json(force=True)
    order_id = event.get("resource", {}).get("id")
    if not order_id:
        return {"status": "ignored"}
    order = db_session.query(Order).filter_by(provider_ref=order_id).first()
    if not order:
        logger.warning("PayPal webhook for unknown order", extra={"order": order_id})
        return {"status": "unknown_order"}, 202
    if order.status != OrderStatus.paid:
        order.status = OrderStatus.paid
        db_session.add(order)
        db_session.commit()
    return {"status": "ok"}


__all__ = ["bp"]
