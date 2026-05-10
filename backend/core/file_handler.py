import mimetypes
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse

from core.config import settings


def _safe_suffix(filename: str | None) -> str:
    if not filename:
        return ""
    return Path(filename).suffix.lower()


async def save_upload(file: UploadFile) -> tuple[str, Path, str]:
    job_id = str(uuid.uuid4())
    original_filename = file.filename or "unknown"
    ext = _safe_suffix(original_filename)
    path = settings.upload_dir / f"{job_id}{ext}"
    size = 0
    limit = settings.max_upload_size_mb * 1024 * 1024

    async with aiofiles.open(path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > limit:
                path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File exceeds max upload size")
            await out.write(chunk)

    return job_id, path, original_filename


def output_path(job_id: str, ext: str) -> Path:
    clean_ext = ext if ext.startswith(".") else f".{ext}"
    return settings.output_dir / f"{job_id}{clean_ext.lower()}"


def resolve_output(path: str | Path) -> Path:
    resolved = Path(path).resolve()
    output_root = settings.output_dir.resolve()
    if output_root not in resolved.parents and resolved != output_root:
        raise HTTPException(status_code=400, detail="Invalid output path")
    if not resolved.exists():
        raise HTTPException(status_code=404, detail="Output not found")
    return resolved


def download_response(path: str | Path, filename: str | None = None) -> FileResponse:
    resolved = resolve_output(path)
    media_type = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
    return FileResponse(resolved, media_type=media_type, filename=filename or resolved.name)

