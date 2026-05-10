from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from core.config import settings
from core.file_handler import download_response, save_upload


JobStatus = str


@dataclass
class Job:
    job_id: str
    toolkit: str
    operation: str
    status: JobStatus
    progress: int = 0
    message: str = "Queued"
    output: str | None = None
    outputs: list[dict[str, str]] = field(default_factory=list)
    original_filename: str = ""
    created_at: str = ""
    updated_at: str = ""


jobs: dict[str, Job] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _set(job_id: str, **changes) -> None:
    job = jobs[job_id]
    for key, value in changes.items():
        setattr(job, key, value)
    job.updated_at = _now()


def create_job(toolkit: str, operation: str, job_id: str, original_filename: str = "") -> Job:
    now = _now()
    job = Job(
        job_id=job_id,
        toolkit=toolkit,
        operation=operation,
        status="queued",
        original_filename=original_filename,
        created_at=now,
        updated_at=now,
    )
    jobs[job_id] = job
    return job


def get_job(job_id: str) -> Job:
    try:
        return jobs[job_id]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc


def status_payload(job_id: str) -> dict:
    return asdict(get_job(job_id))


def mark_unsupported(job_id: str, message: str) -> None:
    _set(job_id, status="unsupported", progress=100, message=message)


def run_job(job_id: str, processor: Callable[[Path], Path | dict[str, Any]], input_path: Path) -> None:
    try:
        _set(job_id, status="running", progress=20, message="Processing")
        result = processor(input_path)
        if isinstance(result, dict) and "outputs" in result:
            _set(
                job_id,
                status="complete",
                progress=100,
                message="Output ready",
                output=str(result.get("zip")),
                outputs=result.get("outputs", []),
            )
        else:
            _set(job_id, status="complete", progress=100, message="Output ready", output=str(result))
    except NotImplementedError as exc:
        mark_unsupported(job_id, str(exc))
    except Exception as exc:
        _set(job_id, status="failed", progress=100, message=str(exc))
    finally:
        input_path.unlink(missing_ok=True)


async def enqueue_upload_job(
    *,
    background_tasks: BackgroundTasks,
    file: UploadFile,
    toolkit: str,
    operation: str,
    processor: Callable[[Path], Path | dict[str, Any]],
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job(toolkit, operation, job_id, original_filename)
    background_tasks.add_task(run_job, job_id, processor, input_path)
    return {"job_id": job_id, "status": "queued"}


def add_status_download_routes(router: APIRouter, toolkit: str) -> None:
    @router.get("/status/{job_id}")
    async def status(job_id: str) -> dict:
        job = get_job(job_id)
        if job.toolkit != toolkit:
            raise HTTPException(status_code=404, detail="Job not found")
        return status_payload(job_id)

    @router.get("/download/{job_id}")
    async def download(job_id: str):
        job = get_job(job_id)
        if job.toolkit != toolkit or not job.output:
            raise HTTPException(status_code=404, detail="Output not found")
        return download_response(job.output)

    @router.get("/download/{job_id}/{file_index}")
    async def download_file(job_id: str, file_index: int):
        job = get_job(job_id)
        if job.toolkit != toolkit or not job.outputs:
            raise HTTPException(status_code=404, detail="Outputs not found")
        try:
            target = job.outputs[file_index]
            return download_response(target["path"], filename=target["name"])
        except (IndexError, KeyError):
            raise HTTPException(status_code=404, detail="File index out of range")


def cleanup_old_outputs(hours: int = 1) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    removed = 0
    for folder in (settings.upload_dir, settings.output_dir):
        for path in folder.glob("*"):
            if path.is_file():
                modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
                if modified < cutoff:
                    path.unlink(missing_ok=True)
                    removed += 1
    return removed

