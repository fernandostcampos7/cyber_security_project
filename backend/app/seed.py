from __future__ import annotations

import random

from argon2 import PasswordHasher

from .db import db_session, init_db
from .models import (
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductImage,
    Review,
    User,
    UserRole,
    Variant,
    generate_uuid,
)
from .utils.sanitize import markdown_to_html

ph = PasswordHasher()


def seed() -> None:
    init_db()
    if db_session.query(User).count() > 0:
        print("Database already seeded")
        return

    admin = User(email="admin@lepax.test", pw_hash=ph.hash("password"), role=UserRole.admin)
    seller = User(email="seller@lepax.test", pw_hash=ph.hash("password"), role=UserRole.seller)
    customer = User(email="customer@lepax.test", pw_hash=ph.hash("password"), role=UserRole.customer)
    db_session.add_all([admin, seller, customer])
    db_session.commit()

    products: list[Product] = []
    for index in range(1, 11):
        product = Product(
            owner_id=seller.id,
            sku=f"LPX-{index:03d}",
            name=f"LePax Statement Piece {index}",
            brand="LePax Atelier",
            category="Accessories" if index % 2 else "Apparel",
            description_md="**Elevate** your silhouette with timeless craftsmanship.",
            price_cents=15000 + index * 100,
            seo_slug=f"lepax-statement-piece-{index}",
            hero_image_url="https://picsum.photos/seed/lepax{}/600/600".format(index),
        )
        db_session.add(product)
        db_session.flush()
        db_session.add_all(
            [
                ProductImage(product_id=product.id, url=product.hero_image_url, sort_index=0),
                Variant(product_id=product.id, size="S", colour="Silver", stock=5, gtin=generate_uuid()),
                Variant(product_id=product.id, size="M", colour="Gold", stock=3, gtin=generate_uuid()),
            ]
        )
        products.append(product)
    db_session.commit()

    order = Order(
        user_id=customer.id,
        total_cents=sum(p.price_cents for p in products[:2]),
        currency="EUR",
        status=OrderStatus.paid,
        payment_provider="stripe",
        provider_ref="pi_seed",
    )
    db_session.add(order)
    db_session.flush()
    for product in products[:2]:
        variant = product.variants[0]
        db_session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                variant_id=variant.id,
                qty=1,
                unit_price_cents=product.price_cents,
            )
        )
        review = Review(
            product_id=product.id,
            user_id=customer.id,
            rating=random.randint(4, 5),
            body_md="*Enchanting* detail and tactile opulence.",
            body_html_sanitised=markdown_to_html("*Enchanting* detail and tactile opulence."),
            images=[product.hero_image_url],
        )
        db_session.add(review)
    db_session.commit()
    print("Seeded demo data")


if __name__ == "__main__":
    seed()
