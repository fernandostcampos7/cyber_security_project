from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.sqlite import BLOB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    customer = "customer"
    seller = "seller"
    admin = "admin"


class SellerApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class OrderStatus(str, enum.Enum):
    created = "created"
    paid = "paid"
    fulfilled = "fulfilled"
    refunded = "refunded"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    pw_hash = Column(BLOB, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.customer)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False)
    seller_application = relationship(
        "SellerApplication", back_populates="user", uselist=False
    )


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    display_name = Column(String, nullable=False)
    avatar_url = Column(String)

    user = relationship("User", back_populates="profile")


class SellerApplication(Base):
    __tablename__ = "seller_applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(SellerApplicationStatus), default=SellerApplicationStatus.pending)
    note = Column(Text)
    decided_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="seller_application")
    decider = relationship("User", foreign_keys=[decided_by])


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"))
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description_md = Column(Text, nullable=False)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String, default="EUR", nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    seo_slug = Column(String, unique=True, nullable=False)
    hero_image_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    images = relationship("ProductImage", back_populates="product")
    variants = relationship("Variant", back_populates="product")
    reviews = relationship("Review", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    url = Column(String, nullable=False)
    sort_index = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class Variant(Base):
    __tablename__ = "variants"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    size = Column(String)
    colour = Column(String)
    stock = Column(Integer, default=0)
    gtin = Column(String)

    product = relationship("Product", back_populates="variants")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    total_cents = Column(Integer, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.created, nullable=False)
    payment_provider = Column(String, nullable=False)
    provider_ref = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    variant_id = Column(String, ForeignKey("variants.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    unit_price_cents = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("Variant")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    body_md = Column(Text, nullable=False)
    body_html_sanitised = Column(Text, nullable=False)
    images = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),)

    product = relationship("Product", back_populates="reviews")


class ReviewFlag(Base):
    __tablename__ = "review_flags"

    id = Column(String, primary_key=True, default=generate_uuid)
    review_id = Column(String, ForeignKey("reviews.id"), nullable=False)
    flagged_by = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    items = relationship("WishlistItem", back_populates="wishlist")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    wishlist_id = Column(String, ForeignKey("wishlists.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wishlist = relationship("Wishlist", back_populates="items")


class EventView(Base):
    __tablename__ = "events_view"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, nullable=False)
    path = Column(String, nullable=False)
    product_id = Column(String, ForeignKey("products.id"))
    referrer = Column(String)
    user_agent = Column(String)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class EventInteraction(Base):
    __tablename__ = "events_interaction"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    session_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    event_data = Column(JSON, default=dict)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    metadata = Column(JSON, default=dict)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False)


fts_products = Table(
    "fts_products",
    Base.metadata,
    Column("name", Text),
    Column("brand", Text),
    Column("category", Text),
    Column("description_md", Text),
    sqlite_with_rowid=False,
)


def to_dict(instance: Any, exclude: set[str] | None = None) -> dict[str, Any]:
    exclude = exclude or set()
    data: dict[str, Any] = {}
    for column in instance.__table__.columns:  # type: ignore[attr-defined]
        if column.name in exclude:
            continue
        data[column.name] = getattr(instance, column.name)
    return data


__all__ = [name for name in globals() if name[0].isupper() or name in {"Base", "to_dict"}]
