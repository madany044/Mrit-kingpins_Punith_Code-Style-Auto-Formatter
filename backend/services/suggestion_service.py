"""Interface for CodeT5-small inference microservice."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

import requests
from flask import current_app

logger = logging.getLogger(__name__)


def request_suggestions(code: str, lint_report: List[Dict[str, Any]], language: str = "javascript") -> Dict[str, Any]:
    settings = current_app.config["SETTINGS"]
    payload = {
        "code": code,
        "language": language,
        "lintReport": lint_report,
        "model": "codet5-small",
    }
    try:
        response = requests.post(settings.suggestion_service_url, json=payload, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:  # noqa: PERF203
        logger.exception("Suggestion service request failed")
        return {
            "suggestions": [],
            "metadata": {
                "status": "error",
                "details": str(exc),
            },
        }

