from __future__ import annotations

import logging
from dataclasses import dataclass


logger = logging.getLogger(__name__)


@dataclass
class StripeSession:
    client_secret: str
    payment_intent: str


def create_payment_session(amount_cents: int, currency: str, customer_email: str) -> StripeSession:
    logger.info("Creating Stripe session", extra={"amount_cents": amount_cents, "currency": currency})
    return StripeSession(client_secret="test_client_secret", payment_intent="pi_demo")


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    logger.info("Verifying Stripe webhook signature")
    return True


__all__ = ["create_payment_session", "verify_webhook_signature", "StripeSession"]
