"\"\"Utility wrapper around static analysis tooling.\"\""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List


def _write_temp_file(code: str, suffix: str) -> Path:
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, mode="w", encoding="utf-8")
    temp.write(code)
    temp.flush()
    return Path(temp.name)


def run_lint_checks(code: str, language: str = "javascript") -> List[Dict[str, str]]:
    """
    Executes language-specific lint commands.
    Currently returns a mocked response if CLI tools are unavailable.
    """
    try:
        suffix = ".py" if language == "python" else ".js"
        file_path = _write_temp_file(code, suffix)
        if language == "python":
            cmd = ["pylint", file_path.name, "--disable=all", "--enable=unused-import,unused-variable,bad-indentation"]
        else:
            cmd = ["eslint", file_path.name, "--format", "json"]
        completed = subprocess.run(cmd, cwd=file_path.parent, capture_output=True, text=True, check=False)
        if completed.returncode != 0 and not completed.stdout:
            raise RuntimeError(completed.stderr)
        return [
            {
                "ruleId": "process",
                "severity": "info",
                "message": completed.stdout or "Lint completed with warnings.",
                "line": 1,
            }
        ]
    except Exception as exc:  # noqa: BLE001 - fallback to mocked payload
        return [
            {
                "ruleId": "no-console",
                "severity": "warning",
                "message": "Placeholder lint run. Install ESLint/Pylint on server.",
                "line": 42,
                "details": str(exc),
            }
        ]

