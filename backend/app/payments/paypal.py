from __future__ import annotations

import logging
from dataclasses import dataclass


logger = logging.getLogger(__name__)


@dataclass
class PayPalOrder:
    id: str
    status: str


def create_order(amount_cents: int, currency: str) -> PayPalOrder:
    logger.info("Creating PayPal order", extra={"amount": amount_cents, "currency": currency})
    return PayPalOrder(id="demo-paypal-order", status="CREATED")


def verify_webhook(payload: bytes, headers: dict[str, str]) -> bool:
    logger.info("Verifying PayPal webhook")
    return True


__all__ = ["create_order", "verify_webhook", "PayPalOrder"]
