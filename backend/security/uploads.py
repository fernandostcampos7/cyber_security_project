import os
import secrets
from pathlib import Path

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from PIL import Image


ALLOWED_EXTENSIONS: set[str] = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _allowed_ext(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def validate_and_save_image(
    file: FileStorage,
    upload_dir: Path,
    subdir: str = "products",
) -> str:
    """
    Validate image type and size, save with a random name under upload_dir/subdir,
    return relative path like 'products/abc123.png'.
    """
    if file.filename is None or file.filename.strip() == "":
        raise ValueError("No filename provided")

    if not _allowed_ext(file.filename):
        raise ValueError("Unsupported file type")

    # Limit size in memory
    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_BYTES:
        raise ValueError("File too large")

    # Verify it is a real image
    try:
        im = Image.open(file.stream)
        im.verify()
    except Exception as exc:
        raise ValueError("Invalid image file") from exc

    # Reset stream pointer after verify
    file.stream.seek(0)

    ext = file.filename.rsplit(".", 1)[1].lower()
    rand = secrets.token_hex(16)
    safe_name = secure_filename(f"{rand}.{ext}")

    target_dir = upload_dir / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    target_path = target_dir / safe_name
    file.save(target_path)

    # Return path relative to uploads root
    return f"{subdir}/{safe_name}"
