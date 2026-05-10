import shutil
import subprocess
from pathlib import Path

from core.config import settings


def require_binary(name: str) -> str:
    configured = settings.ffmpeg_bin if name == "ffmpeg" else settings.libreoffice_bin
    resolved = shutil.which(configured)
    if not resolved:
        raise NotImplementedError(f"{configured} is not available on PATH")
    return resolved


def run_checked(cmd: list[str], env: dict[str, str] | None = None) -> None:
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False, env=env)
    if proc.returncode != 0:
        detail = proc.stderr.strip() or proc.stdout.strip() or "Command failed"
        raise RuntimeError(detail)

