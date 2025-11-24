from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.datastructures import FileStorage

from backend.security.uploads import validate_and_save_image

bp = Blueprint("uploads", __name__)


@bp.post("/api/uploads/image")
def upload_image():
    if "file" not in request.files:
        return jsonify(error="Missing file field"), 400

    uploaded: FileStorage = request.files["file"]

    try:
        upload_root: Path = current_app.config["UPLOAD_ROOT"]
    except KeyError:
        return jsonify(error="Upload root not configured"), 500

    try:
        rel_path = validate_and_save_image(uploaded, upload_root, subdir="products")
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    # Public URL for frontend
    url = f"/media/{rel_path}"
    return jsonify(ok=True, path=rel_path, url=url), 201


@bp.get("/media/<path:rel_path>")
def serve_media(rel_path: str):
    try:
        upload_root: Path = current_app.config["UPLOAD_ROOT"]
    except KeyError:
        return jsonify(error="Upload root not configured"), 500

    # No path traversal, Path will normalise
    safe_root = upload_root.resolve()
    target = (safe_root / rel_path).resolve()

    if not str(target).startswith(str(safe_root)):
        return jsonify(error="Invalid path"), 400

    if not target.exists():
        return jsonify(error="Not found"), 404

    return send_from_directory(safe_root, rel_path)
