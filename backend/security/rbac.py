from functools import wraps
from flask import g, abort


def require_login(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = getattr(g, "current_user", None)
        if not user:
            abort(401)
        return fn(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user or user.role not in roles:
                abort(403)
            return fn(*args, **kwargs)

        return wrapper

    return deco
