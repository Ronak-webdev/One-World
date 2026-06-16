import asyncio
import sqlite3
import json
import shutil
import zipfile
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from core.file_handler import download_response, output_path, save_upload


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "complete"
    FAILED = "failed"


# ─── SQLite-backed persistent job store ──────────────────────────────────────
# Use an ABSOLUTE path derived from __file__ so all uvicorn worker/reload
# processes open the exact same file regardless of their working directory.

_DB_PATH = Path(__file__).resolve().parent.parent / "temp" / "jobs.db"
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                toolkit TEXT,
                tool TEXT,
                original_filename TEXT,
                status TEXT DEFAULT 'queued',
                result_path TEXT,
                results TEXT DEFAULT '{}',
                partial_results TEXT DEFAULT '[]',
                zip_path TEXT,
                error TEXT
            )
        """)
        conn.commit()

_init_db()


def _job_to_dict(row) -> Dict[str, Any]:
    d = dict(row)
    d["results"] = json.loads(d.get("results") or "{}")
    d["partial_results"] = json.loads(d.get("partial_results") or "[]")
    return d


def update_job_partial(job_id: str, partial_data: Any):
    """Updates the partial_results column for a job. Useful for streaming progress."""
    with _get_conn() as conn:
        conn.execute(
            "UPDATE jobs SET partial_results=? WHERE job_id=?",
            (json.dumps(partial_data), job_id)
        )
        conn.commit()


def create_job(toolkit: str, tool: str, job_id: str, original_filename: str):
    print(f"[Backend] Creating job {job_id} for {toolkit}/{tool}")
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO jobs (job_id, toolkit, tool, original_filename, status, results) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (job_id, toolkit, tool, original_filename, JobStatus.QUEUED, "{}")
        )
        conn.commit()


def create_job_zip(job_id: str, results: Dict[str, str]) -> Path:
    with _get_conn() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
    job = _job_to_dict(row)
    if job.get("zip_path"):
        p = Path(job["zip_path"])
        if p.exists():
            return p

    # Create zip in the same directory as the first result
    first_result = Path(next(iter(results.values())))
    zip_path = first_result.parent / f"{job_id}_collection.zip"
    
    print(f"[Backend] Creating ZIP for job {job_id} at {zip_path}")
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
        for key, path_str in results.items():
            path = Path(path_str)
            if path.exists():
                original = Path(job["original_filename"])
                # Clean arcname: "original_name (stem).ext"
                arcname = f"{original.stem} ({key}){path.suffix}"
                zipf.write(path, arcname=arcname)
            else:
                print(f"[Backend] Warning: File {path_str} not found while zipping job {job_id}")

    with _get_conn() as conn:
        conn.execute("UPDATE jobs SET zip_path=? WHERE job_id=?", (str(zip_path), job_id))
        conn.commit()
    return zip_path


async def run_job(_job_id: str, func: Callable, *args, **kwargs):
    with _get_conn() as conn:
        if not conn.execute("SELECT 1 FROM jobs WHERE job_id=?", (_job_id,)).fetchone():
            return
        conn.execute("UPDATE jobs SET status=? WHERE job_id=?", (JobStatus.PROCESSING, _job_id))
        conn.commit()

    try:
        import inspect
        print(f"[Backend] Starting job {_job_id} with processor {func.__name__}")
        
        # Only pass kwargs that the function actually accepts
        # We also ensure the function gets the job_id if it needs it
        kwargs["job_id"] = _job_id
        sig = inspect.signature(func)
        has_var_kwargs = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values())
        
        if has_var_kwargs:
            valid_kwargs = kwargs
        else:
            valid_kwargs = {k: v for k, v in kwargs.items() if k in sig.parameters}
        
        if asyncio.iscoroutinefunction(func):
            result = await func(*args, **valid_kwargs)
        else:
            result = await asyncio.to_thread(func, *args, **valid_kwargs)

        print(f"[Backend] Job {_job_id} finished. Result type: {type(result)}")
        with _get_conn() as conn:
            if isinstance(result, Path):
                print(f"[Backend] Job {_job_id} completed with Path: {result}")
                conn.execute(
                    "UPDATE jobs SET status=?, result_path=? WHERE job_id=?",
                    (JobStatus.COMPLETED, str(result), _job_id)
                )
            elif isinstance(result, dict):
                results_dict = {k: str(v) if isinstance(v, Path) else v for k, v in result.items()}
                print(f"[Backend] Job {_job_id} completed with Dict: {list(results_dict.keys())}")
                first_val = str(next(iter(results_dict.values()))) if results_dict else None
                conn.execute(
                    "UPDATE jobs SET status=?, results=?, result_path=? WHERE job_id=?",
                    (JobStatus.COMPLETED, json.dumps(results_dict), first_val, _job_id)
                )
            else:
                print(f"[Backend] Job {_job_id} completed with UNKNOWN result type: {type(result)}")
                conn.execute(
                    "UPDATE jobs SET status=? WHERE job_id=?",
                    (JobStatus.COMPLETED, _job_id)
                )
            conn.commit()
            print(f"[Backend] Job {_job_id} status updated to COMPLETED in DB")
    except Exception as e:
        import traceback
        traceback.print_exc()
        with _get_conn() as conn:
            conn.execute(
                "UPDATE jobs SET status=?, error=? WHERE job_id=?",
                (JobStatus.FAILED, str(e), _job_id)
            )
            conn.commit()
        print(f"[Backend] Job {_job_id} FAILED: {e}")


async def enqueue_upload_job(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    toolkit: str,
    operation: str,
    processor: Callable,
    **kwargs
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job(toolkit, operation, job_id, original_filename)
    background_tasks.add_task(run_job, job_id, processor, input_path, job_id=job_id, **kwargs)
    return {"job_id": job_id, "status": JobStatus.QUEUED}


def add_status_download_routes(router: APIRouter, toolkit: str):
    """Adds standardized status and download routes to a router."""

    @router.get(f"/status/{{job_id}}")
    async def get_status(job_id: str):
        print(f"[Backend] Status poll for job {job_id} on toolkit {toolkit}")
        with _get_conn() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
        if not row:
            print(f"[Backend] Job {job_id} NOT FOUND in DB")
            raise HTTPException(status_code=404, detail="Job not found")
        return {**_job_to_dict(row), "job_id": job_id}

    @router.get(f"/download/{{job_id}}")
    async def download_job(job_id: str, type: Optional[str] = None, inline: bool = False):
        print(f"[Backend] Download request for job {job_id} (type: {type})")
        with _get_conn() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
        if not row:
            print(f"[Backend] Download failed: Job {job_id} not found")
            raise HTTPException(status_code=404, detail="Job not found")
        job = _job_to_dict(row)

        if job["status"] != JobStatus.COMPLETED:
            print(f"[Backend] Download failed: Job {job_id} status is {job['status']}")
            raise HTTPException(
                status_code=400,
                detail=f"Job not completed (status: {job['status']})",
            )

        path_str = None
        results = job.get("results", {})
        if isinstance(results, str):
            try:
                results = json.loads(results)
            except:
                results = {}
        
        if type and results and type in results:
            path_str = results[type]
        elif type and job.get("result_path"):
            # Fallback for older jobs or single-file results that might match the naming
            potential_path = Path(job["result_path"])
            if type in potential_path.name.lower():
                path_str = str(potential_path)
        
        if not type:
            if results and len(results) > 1:
                path_str = str(create_job_zip(job_id, results))
            else:
                path_str = job.get("result_path")

        if not path_str:
            print(f"[Backend] Download failed: No file path found for job {job_id} type {type}. Results: {results}")
            raise HTTPException(status_code=404, detail=f"Requested file type '{type}' not found for this job")

        path = Path(path_str)
        if not path.exists():
            print(f"[Backend] Download failed: File {path} does not exist on disk")
            raise HTTPException(status_code=404, detail="Result file not found on disk")

        original = Path(job["original_filename"])
        suffix = f" ({type})" if type else ""
        # Ensure we don't end up with double extensions if path is already a zip
        clean_suffix = path.suffix if path.suffix.lower() == ".zip" else path.suffix
        download_name = f"{original.stem}{suffix}{clean_suffix}"

        return download_response(path, filename=download_name, inline=inline)
