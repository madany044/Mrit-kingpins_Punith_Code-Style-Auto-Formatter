from __future__ import annotations

import os
import json
import difflib
import logging
from typing import List, Dict, Any

from flask import Flask, request, jsonify, abort, make_response
from flask_cors import CORS
from dotenv import load_dotenv

from config import get_settings
from routes import api_bp
from services.firebase_client import init_firebase_app

load_dotenv()
logger = logging.getLogger(__name__)

# ------------------ OpenAI Setup ------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
openai_new_sdk = False

try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    openai_new_sdk = True
except Exception:
    import openai
    openai.api_key = OPENAI_API_KEY
    openai_client = openai
    openai_new_sdk = False


# ---------- Prompt building ----------
def build_prompt(code: str, task: str, language: str) -> List[Dict[str, str]]:
    base = (
        "You are a senior software engineer. "
        "You will receive code and must reply STRICTLY in JSON with fields: "
        "formatted_code, issues, suggestions, explanation."
    )

    user_msg = f"""
TASK: {task}
LANGUAGE: {language}
CODE:
"""
    return [
        {"role": "system", "content": base},
        {"role": "user", "content": user_msg},
    ]


def extract_assistant(resp: Any) -> str:
    try:
        return resp.choices[0].message.content
    except:
        return str(resp)


def make_patch(original: str, fixed: str) -> str:
    return "".join(
        difflib.unified_diff(
            original.splitlines(keepends=True),
            fixed.splitlines(keepends=True),
            fromfile="a/file",
            tofile="b/file",
        )
    )


# ------------------ Flask App ------------------
def create_app() -> Flask:
    app = Flask(__name__)
    settings = get_settings()
    app.config["SETTINGS"] = settings
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(api_bp)

    @app.route("/api/lint", methods=["POST"])
    def lint():
        body = request.get_json(force=True)
        code = body.get("code", "")
        language = body.get("language", "python")

        if not code:
            return abort(make_response(jsonify({"error": "code is required"}), 400))

        prompt = build_prompt(code, "Fix formatting & lint issues", language)

        if openai_new_sdk:
            resp = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=prompt,
                temperature=0.0
            )
        else:
            resp = openai_client.ChatCompletion.create(
                model="gpt-4o",
                messages=prompt,
                temperature=0.0
            )

        raw = extract_assistant(resp)

        try:
            output = json.loads(
                raw.strip().removeprefix("```json").removesuffix("```").strip()
            )
        except Exception:
            return jsonify({"error": "Bad response from AI", "raw": raw}), 500

        if output.get("formatted_code"):
            output["patch"] = make_patch(code, output["formatted_code"])

        return jsonify(output)

    @app.route("/api/suggest", methods=["POST"])
    def suggest():
        body = request.get_json(force=True)
        code = body.get("code", "")
        language = body.get("language", "python")

        if not code:
            return abort(make_response(jsonify({"error": "code is required"}), 400))

        prompt = build_prompt(code, "Provide suggestions & improvements", language)

        if openai_new_sdk:
            resp = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=prompt,
                temperature=0.2
            )
        else:
            resp = openai_client.ChatCompletion.create(
                model="gpt-4o",
                messages=prompt,
                temperature=0.2
            )

        raw = extract_assistant(resp)

        try:
            output = json.loads(
                raw.strip().removeprefix("```json").removesuffix("```").strip()
            )
        except Exception:
            return jsonify({"error": "Bad response from AI", "raw": raw}), 500

        return jsonify(output)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    with app.app_context():
        init_firebase_app()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
