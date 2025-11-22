#!/usr/bin/env python3
"""Helper script to run the preview server."""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    preview_server_path = Path(__file__).parent / "preview_server.py"
    subprocess.run([sys.executable, str(preview_server_path)])