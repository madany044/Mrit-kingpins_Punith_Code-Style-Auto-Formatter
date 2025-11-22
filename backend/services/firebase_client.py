"""Firebase Admin helpers for auth + Firestore access."""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Dict

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials, firestore

from config import Settings, get_settings

logger = logging.getLogger(__name__)

def _build_credentials(settings: Settings):
    if settings.firebase_credentials_json:
        return credentials.Certificate(settings.firebase_credentials_json)
    if settings.firebase_credentials_path:
        return credentials.Certificate(str(settings.firebase_credentials_path))
    raise RuntimeError("Firebase credentials missing. Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS.")


@lru_cache(maxsize=1)
def init_firebase_app() -> firebase_admin.App:
    settings = get_settings()
    if firebase_admin._apps:
        return firebase_admin.get_app()
    cred = _build_credentials(settings)
    return firebase_admin.initialize_app(cred)


def get_auth_client() -> fb_auth:
    init_firebase_app()
    return fb_auth


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.Client:
    init_firebase_app()
    return firestore.client()


def ensure_user_document(uid: str, data: Dict[str, Any]) -> None:
    try:
        db = get_firestore_client()
        user_ref = db.collection("users").document(uid)
        
        # Check if document exists first
        existing = user_ref.get()
        if existing.exists:
            logger.info(f"Updating existing user document: {uid}")
            user_ref.set(data, merge=True)
        else:
            logger.info(f"Creating new user document: {uid}")
            user_ref.set(data)
            
        logger.info(f"User document ensured for: {uid}")
        
    except Exception as e:
        logger.error(f"Error ensuring user document for {uid}: {str(e)}")
        raise

