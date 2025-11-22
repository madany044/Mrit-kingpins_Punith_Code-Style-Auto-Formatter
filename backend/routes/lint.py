from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.lint_service import run_lint_checks
from utils.jwt_utils import require_jwt

lint_bp = Blueprint("lint", __name__, url_prefix="/api/lint")


@lint_bp.route("", methods=["POST"])
@require_jwt
def lint_code(current_user):
    payload = request.get_json(force=True)
    code = payload.get("code", "")
    language = payload.get("language", "javascript")

    if not code:
        return jsonify({"error": "Code payload is required."}), 400

    lint_report = run_lint_checks(code, language)
    return jsonify({"lintReport": lint_report, "user": current_user})

