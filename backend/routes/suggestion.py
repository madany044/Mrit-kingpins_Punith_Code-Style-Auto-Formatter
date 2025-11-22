from __future__ import annotations

from flask import Blueprint, jsonify, request

from services.suggestion_service import request_suggestions
from utils.jwt_utils import require_jwt

suggestion_bp = Blueprint("suggestion", __name__, url_prefix="/api/suggest")


@suggestion_bp.route("", methods=["POST"])
@require_jwt
def suggest_code(current_user):
    payload = request.get_json(force=True)
    code = payload.get("code", "")
    lint_report = payload.get("lintReport", [])
    language = payload.get("language", "javascript")

    if not code:
        return jsonify({"error": "Code payload is required."}), 400

    suggestions = request_suggestions(code, lint_report, language)
    return jsonify({"suggestions": suggestions, "user": current_user})

