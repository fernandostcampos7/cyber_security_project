from __future__ import annotations

from flask import Blueprint, jsonify

from ..auth import get_current_user, login_required
from ..db import db_session
from ..models import Order, to_dict

bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@bp.get("")
@login_required()
def list_orders(user):
    orders = db_session.query(Order).filter_by(user_id=user.id).all()
    return jsonify({"orders": [to_dict(order) for order in orders]})


__all__ = ["bp"]
