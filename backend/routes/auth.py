# routes/auth.py
from __future__ import annotations

import logging
from typing import Any, Dict
from flask import Blueprint, current_app, jsonify, request
from firebase_admin import auth as fb_auth
from firebase_admin.exceptions import FirebaseError
from services.firebase_client import ensure_user_document, get_auth_client
from utils.jwt_utils import generate_jwt

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register_user():
    try:
        logger.info("=== REGISTRATION STARTED ===")
        
        # Check if content type is JSON
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Invalid JSON payload"}), 400
            
        logger.info(f"Registration payload: {payload}")
        
        email = payload.get("email", "").strip()
        password = payload.get("password", "")
        display_name = payload.get("name", "").strip()

        logger.info(f"Extracted fields - email: {email}, name: {display_name}")

        # Validation
        if not email or not password or not display_name:
            return jsonify({"error": "Name, email, and password are required."}), 400

        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        auth_client = get_auth_client()
        
        try:
            logger.info("Creating Firebase Auth user...")
            user_record = auth_client.create_user(
                email=email, 
                password=password, 
                display_name=display_name
            )
            logger.info(f"Firebase user created successfully: {user_record.uid}")
            
        except fb_auth.EmailAlreadyExistsError:
            logger.error("Email already exists")
            return jsonify({"error": "Email already registered"}), 400
        except FirebaseError as exc:
            logger.error(f"Firebase error: {str(exc)}")
            return jsonify({"error": f"Authentication error: {str(exc)}"}), 400
        except Exception as exc:
            logger.error(f"Unexpected error creating user: {str(exc)}")
            return jsonify({"error": "Failed to create user account"}), 400

        # Create user document in Firestore
        try:
            logger.info("Creating Firestore user document...")
            user_data = {
                "email": email,
                "displayName": display_name,
                "createdAt": user_record.user_metadata.creation_timestamp,
                "role": "user",
            }
            ensure_user_document(user_record.uid, user_data)
            logger.info("Firestore user document created successfully")
        except Exception as exc:
            logger.error(f"Error creating Firestore document: {str(exc)}")
            # Continue even if Firestore fails - the user is already created in Auth

        logger.info("=== REGISTRATION COMPLETED SUCCESSFULLY ===")
        return jsonify({
            "uid": user_record.uid, 
            "email": email,
            "displayName": display_name,
            "message": "User registered successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"Unexpected error in registration: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route("/login", methods=["POST"])
def login_user():
    try:
        logger.info("=== LOGIN STARTED ===")
        
        # Check if content type is JSON
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Invalid JSON payload"}), 400
            
        logger.info(f"Login payload: {payload}")
        
        email = payload.get("email", "").strip()
        password = payload.get("password", "")

        logger.info(f"Login attempt for email: {email}")

        # Validation
        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        auth_client = get_auth_client()
        
        try:
            # For login, we need to use Firebase Admin SDK to verify password
            # Note: Firebase Admin SDK doesn't have a direct password verification method
            # So we'll rely on the client-side Firebase Auth and then verify the token
            logger.info("Login requires client-side Firebase Auth. Use /session endpoint with Firebase ID token.");
            return jsonify({
                "error": "Use client-side Firebase Authentication and exchange ID token via /session endpoint"
            }), 400
            
        except Exception as exc:
            logger.error(f"Login error: {str(exc)}")
            return jsonify({"error": "Login failed"}), 400

    except Exception as e:
        logger.error(f"Unexpected error in login: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route("/session", methods=["POST"])
def exchange_token():
    try:
        logger.info("=== SESSION EXCHANGE STARTED ===")
        
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        body = request.get_json()
        if not body:
            return jsonify({"error": "Invalid JSON payload"}), 400
            
        logger.info(f"Session exchange body: {body}")
        
        id_token = body.get("idToken")
        profile = body.get("profile") or {}

        if not id_token:
            logger.error("Missing idToken in session exchange")
            return jsonify({"error": "idToken is required"}), 400

        auth_client = get_auth_client()
        
        try:
            logger.info("Verifying Firebase ID token...")
            decoded = auth_client.verify_id_token(id_token)
            logger.info(f"Token verified for user: {decoded['uid']}")
            
        except (fb_auth.InvalidIdTokenError, fb_auth.ExpiredIdTokenError, fb_auth.RevokedIdTokenError) as exc:
            logger.error(f"Invalid ID token: {str(exc)}")
            return jsonify({"error": "Invalid or expired Firebase token"}), 401
        except Exception as exc:
            logger.error(f"Error verifying token: {str(exc)}")
            return jsonify({"error": "Token verification failed"}), 401

        # Get user record to check if user exists and get additional info
        try:
            user_record = auth_client.get_user(decoded["uid"])
            logger.info(f"User record retrieved: {user_record.uid}")
        except Exception as exc:
            logger.error(f"Error getting user record: {str(exc)}")
            return jsonify({"error": "User not found"}), 404

        # Ensure user document exists
        try:
            logger.info("Ensuring user document in session exchange...")
            user_data = {
                "email": user_record.email,
                "displayName": profile.get("displayName") or user_record.display_name or "",
                "lastLogin": decoded.get("auth_time"),
                "role": "user",  # Default role
                "emailVerified": user_record.email_verified,
            }
            ensure_user_document(decoded["uid"], user_data)
            logger.info("User document ensured successfully")
        except Exception as exc:
            logger.error(f"Error ensuring user document: {str(exc)}")
            # Continue even if Firestore update fails

        # Generate JWT
        try:
            logger.info("Generating JWT token...")
            jwt_payload = {
                "uid": decoded["uid"], 
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified
            }
            jwt_token = generate_jwt(jwt_payload)
            logger.info("JWT token generated successfully")
        except Exception as exc:
            logger.error(f"Error generating JWT: {str(exc)}")
            return jsonify({"error": "JWT generation failed"}), 500

        logger.info("=== SESSION EXCHANGE COMPLETED SUCCESSFULLY ===")
        return jsonify({
            "token": jwt_token, 
            "uid": decoded["uid"], 
            "email": user_record.email,
            "displayName": user_record.display_name,
            "emailVerified": user_record.email_verified
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in session exchange: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """Get current user profile"""
    try:
        # This would require JWT authentication middleware
        # For now, we'll return a placeholder
        return jsonify({"error": "JWT authentication required"}), 401
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route("/logout", methods=["POST"])
def logout_user():
    """Logout user - client should clear tokens"""
    try:
        # With JWT, logout is handled client-side by removing the token
        return jsonify({"message": "Logged out successfully"})
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500