import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(BASE_DIR, "lepax.db")
SQLALCHEMY_URL = f"sqlite:///{DB_PATH}"
