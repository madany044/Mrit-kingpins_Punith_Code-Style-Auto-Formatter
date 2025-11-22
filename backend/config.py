"""Application configuration and environment loading."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()


def _load_json_from_env(value: str | None) -> Optional[Dict[str, Any]]:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


@dataclass
class Settings:
    firebase_credentials_path: Optional[Path]
    firebase_credentials_json: Optional[Dict[str, Any]]
    firebase_api_key: Optional[str]
    firestore_default_collection: str = "projects"
    jwt_secret: str = field(default_factory=lambda: os.getenv("JWT_SECRET", "change-me"))
    jwt_expires_in: int = field(default_factory=lambda: int(os.getenv("JWT_EXPIRES_IN", "3600")))
    cors_origins: List[str] = field(
        default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    )
    suggestion_service_url: str = field(default_factory=lambda: os.getenv("SUGGESTION_SERVICE_URL", "http://localhost:8000/api/generate"))


def get_settings() -> Settings:
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    firebase_json = _load_json_from_env(os.getenv("FIREBASE_CREDENTIALS"))
    firebase_api_key = os.getenv("FIREBASE_WEB_API_KEY")

    return Settings(
        firebase_credentials_path=Path(credentials_path) if credentials_path else None,
        firebase_credentials_json=firebase_json,
        firebase_api_key=firebase_api_key,
    )

