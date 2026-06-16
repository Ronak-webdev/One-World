from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path
from core.job_queue import add_status_download_routes, enqueue_upload_job
from core.media import require_binary, run_checked

router = APIRouter()


def convert_audio(input_path: Path, output_format: str, job_id: str) -> Path:
    fmt = output_format.lower().strip(".")
    out_path = output_path(job_id, fmt)
    ffmpeg = require_binary("ffmpeg")
    run_checked([ffmpeg, "-y", "-i", str(input_path), str(out_path)])
    return out_path


@router.post("/convert")
async def audio_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("mp3"),
) -> dict:
    from core.file_handler import save_upload
    from core.job_queue import create_job, run_job
    
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "convert", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: convert_audio(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}

