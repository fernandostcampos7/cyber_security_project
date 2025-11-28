from backend.db.database import engine
from backend.models import models as m
from backend.scripts.seed_products import seed_products
from backend.scripts.seed_users import seed as seed_users


def main() -> None:
    print("🔧 Creating tables if they do not exist...")
    # This will create ALL tables defined on Base (User, Product, etc.)
    m.Base.metadata.create_all(bind=engine)

    print("👤 Seeding users...")
    seed_users()

    print("🛍️ Seeding products...")
    seed_products()

    print("✅ Database bootstrap completed.")


if __name__ == "__main__":
    main()
