"""Standalone preview server running on port 50000."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# In-memory storage for preview content
_preview_cache: dict[str, dict] = {}


@app.route("/preview", methods=["POST"])
def set_preview():
    """Set preview content."""
    try:
        data = request.get_json(force=True)
        if not data:
            logger.warning("No JSON data received")
            return jsonify({"error": "No data received"}), 400
            
        code = data.get("code", "")
        filename = data.get("filename", "preview.html")
        file_type = data.get("type", "html")
        
        logger.info(f"Received preview request for {filename}, type: {file_type}, code length: {len(code)}")
        
        if not code:
            return jsonify({"error": "Code content is required."}), 400
        
        # Store in cache with a simple key
        preview_id = data.get("preview_id", "default")
        _preview_cache[preview_id] = {
            "code": code,
            "filename": filename,
            "type": file_type
        }
        
        logger.info(f"Stored preview with ID: {preview_id}")
        
        return jsonify({
            "status": "ok", 
            "preview_id": preview_id, 
            "url": f"http://localhost:50000/view?preview_id={preview_id}"
        })
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to set preview")
        return jsonify({"error": str(exc)}), 500


@app.route("/view", methods=["GET"])
def view_preview():
    """View preview content."""
    preview_id = request.args.get("preview_id", "default")
    
    if preview_id not in _preview_cache:
        return Response(
            "<html><body><h1>No preview available</h1><p>Please upload a file first.</p></body></html>",
            mimetype="text/html"
        )
    
    preview_data = _preview_cache[preview_id]
    code = preview_data["code"]
    filename = preview_data["filename"]
    file_type = preview_data["type"]
    
    if file_type.lower() == "html" or filename.endswith(".html"):
        content = code
        content_type = "text/html"
    elif file_type.lower() == "css" or filename.endswith(".css"):
        # Wrap CSS in HTML for preview
        content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Preview</title>
    <style>
        {code}
        
        /* Default preview container */
        body {{
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }}
        .preview-container {{
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .demo-button {{
            margin: 10px;
            padding: 12px 24px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }}
        .demo-box {{
            padding: 20px;
            margin: 10px 0;
            background: #ecf0f1;
            border-radius: 4px;
            border-left: 4px solid #3498db;
        }}
    </style>
</head>
<body>
    <div class="preview-container">
        <h1>🎨 CSS Preview</h1>
        <p>This is a live preview of your CSS styles.</p>
        <button class="demo-button">Styled Button</button>
        <div class="demo-box">
            <h3>Styled Box</h3>
            <p>All elements are styled with your CSS.</p>
        </div>
    </div>
</body>
</html>"""
        content_type = "text/html"
    else:
        # For other file types, show as code
        content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview - {filename}</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            background: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
            padding: 20px;
        }}
        .code-preview {{
            background: #2d2d2d;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 1000px;
            margin: 0 auto;
        }}
        pre {{
            margin: 0;
            white-space: pre-wrap;
            line-height: 1.5;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="code-preview">
        <h3>📄 {filename}</h3>
        <pre>{code.replace('<', '&lt;').replace('>', '&gt;')}</pre>
    </div>
</body>
</html>"""
        content_type = "text/html"
    
    return Response(
        content,
        mimetype=content_type,
        headers={
            "Content-Type": content_type,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "port": 50000})


@app.route("/", methods=["GET"])
def index():
    """Root endpoint for testing."""
    return jsonify({
        "message": "Preview server is running",
        "endpoints": {
            "POST /preview": "Set preview content",
            "GET /view?preview_id=<id>": "View preview content",
            "GET /health": "Health check"
        }
    })


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger.info("Starting preview server on port 50000...")
    logger.info("Preview server will be available at http://localhost:50000")
    try:
        app.run(host="0.0.0.0", port=50000, debug=True)
    except OSError as e:
        if "Address already in use" in str(e):
            logger.error(f"Port 50000 is already in use. Please stop the other process or use a different port.")
        else:
            logger.error(f"Failed to start preview server: {e}")
        raise



