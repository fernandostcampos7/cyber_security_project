from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()  # Default


def hash_password(plain: str) -> str:
    return ph.hash(plain)


def verify_password(hash_value: str, plain: str) -> bool:
    try:
        return ph.verify(hash_value, plain)
    except VerifyMismatchError:
        return False
