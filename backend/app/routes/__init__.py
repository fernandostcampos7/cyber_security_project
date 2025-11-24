from __future__ import annotations

from flask import Flask

from . import admin, cart, catalog, orders, reviews, seller, track, webhooks
from ..auth import bp as auth_bp


BLUEPRINTS = [
    auth_bp,
    catalog.bp,
    cart.bp,
    orders.bp,
    reviews.bp,
    seller.bp,
    admin.bp,
    track.bp,
    webhooks.bp,
]


def register_blueprints(app: Flask) -> None:
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)


__all__ = ["register_blueprints"]
