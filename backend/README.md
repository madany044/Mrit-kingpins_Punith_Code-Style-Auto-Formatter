# KingPins Debugger — Flask Backend

## Overview
REST + WebSocket-ready Flask service that:
- Verifies Firebase ID tokens and issues project JWTs.
- Persists user/projects metadata in Firestore.
- Runs lint jobs (ESLint/Pylint placeholder) and proxies CodeT5-small suggestions from the model microservice.

## Getting Started
1. **Install dependencies**
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. **Add environment variables** (`.env`)
   ```
   FIREBASE_CREDENTIALS_PATH=path/to/serviceAccount.json
   # or embed base64/json:
   # FIREBASE_CREDENTIALS='{"type": "..."}'
   FIREBASE_WEB_API_KEY=YOUR_FIREBASE_WEB_API_KEY
   JWT_SECRET=super-secret-key
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   SUGGESTION_SERVICE_URL=http://localhost:8000/api/generate
   ```
3. **Run the server**
   ```bash
   flask --app app run --debug
   ```

## API Surface
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create Firebase user + Firestore doc. |
| POST | `/api/auth/session` | Exchange Firebase `idToken` → backend JWT. |
| POST | `/api/lint` | Run lint (requires `Authorization: Bearer <JWT>`). |
| POST | `/api/suggest` | Call CodeT5 inference service (requires JWT). |

## Firebase Integration
- Uses Admin SDK (`firebase_admin`) initialized via service account.
- `services/firebase_client.py` exposes singleton clients + helper to ensure `users/{uid}` document.
- Firestore security rules from `docs/product-spec.md` ensure per-user access.

## Extending
- Replace placeholder lint command with production ESLint/Pylint container images or run through queued workers.
- Implement Socket.IO namespace for streaming long-running suggestion progress, keeping REST endpoint as trigger.
- Persist lint/suggestion responses back to Firestore via `projects/{projectId}/files/{fileId}` documents for dashboard hydration.

