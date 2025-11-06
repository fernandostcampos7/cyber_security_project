from __future__ import annotations

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../instance/lepax.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    future=True,
)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))

db_session = SessionLocal


def init_db() -> None:
    from . import models  # noqa: F401

    models.Base.metadata.create_all(bind=engine)


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


__all__ = ["db_session", "init_db", "session_scope", "engine", "DATABASE_URL"]
