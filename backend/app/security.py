from __future__ import annotations

import functools
import time
from collections import defaultdict
from typing import Callable

from flask import Flask, Response, request


def apply_security_headers(app: Flask) -> None:
    @app.after_request
    def set_headers(response: Response) -> Response:
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "0")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "img-src 'self' data: blob: https://*.stripe.com https://*.paypal.com; "
            "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https://api.stripe.com https://www.paypal.com;",
        )
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), camera=(), microphone=()")
        return response


_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def rate_limit(key_func: Callable[[], str], limit: int, per: int) -> Callable:
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            key = key_func()
            bucket = _rate_limit_store[key]
            _rate_limit_store[key] = [ts for ts in bucket if ts > now - per]
            if len(_rate_limit_store[key]) >= limit:
                return {"error": "Too many requests"}, 429
            _rate_limit_store[key].append(now)
            return func(*args, **kwargs)

        return wrapper

    return decorator


def init_rate_limiter(app: Flask) -> None:
    @app.before_request
    def apply_limit() -> None:
        if request.endpoint and request.endpoint.startswith("api."):
            key = request.remote_addr or "unknown"
            bucket = _rate_limit_store[key]
            now = time.time()
            _rate_limit_store[key] = [ts for ts in bucket if ts > now - 60]
            if len(_rate_limit_store[key]) >= 120:
                return ("Too many requests", 429)
            _rate_limit_store[key].append(now)


__all__ = ["apply_security_headers", "init_rate_limiter", "rate_limit"]
