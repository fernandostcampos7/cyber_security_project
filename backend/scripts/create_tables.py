from backend.db.database import Base, engine

# Import all models so they are registered with Base.metadata
import backend.models.models  # noqa


def main():
    print("Creating any missing tables in lepax.db...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    main()
