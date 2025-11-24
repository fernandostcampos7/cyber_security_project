"""
Database configuration for LePax.
Initialises the SQLAlchemy engine, Base, and session factory.
"""

from .database import Base, engine, SessionLocal
