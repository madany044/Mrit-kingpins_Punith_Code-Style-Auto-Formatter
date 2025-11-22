"""JWT helpers + decorator."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Any, Callable, Dict, Tuple

import jwt
from flask import Request, current_app, jsonify, request

logger = logging.getLogger(__name__)

def generate_jwt(payload: Dict[str, Any]) -> str:
    try:
        expires_in = current_app.config.get("JWT_EXPIRES_IN", 3600)
        secret = current_app.config.get("JWT_SECRET", "change-me")
        exp = datetime.now(tz=timezone.utc) + timedelta(seconds=expires_in)
        token_payload = {**payload, "exp": exp}
        token = jwt.encode(token_payload, secret, algorithm="HS256")
        logger.info("JWT token generated successfully")
        return token
    except Exception as e:
        logger.error(f"Error generating JWT: {str(e)}")
        raise

def decode_jwt(token: str) -> Dict[str, Any]:
    try:
        secret = current_app.config.get("JWT_SECRET", "change-me")
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        logger.error("JWT token expired")
        raise
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid JWT token: {str(e)}")
        raise

def _extract_bearer_token(req: Request) -> Tuple[bool, str | None]:
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return True, auth_header.split(" ", 1)[1]
    return False, None

def require_jwt(fn: Callable) -> Callable:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        is_bearer, token = _extract_bearer_token(request)
        if not is_bearer or not token:
            return jsonify({"error": "Missing Authorization header"}), 401
        try:
            payload = decode_jwt(token)
        except jwt.PyJWTError as e:
            return jsonify({"error": "Invalid or expired token"}), 401
        return fn(*args, current_user=payload, **kwargs)

    return wrapper