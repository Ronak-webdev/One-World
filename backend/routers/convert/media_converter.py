from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job
from core.media import require_binary, run_checked

router = APIRouter()


def process_media(input_path: Path, output_format: str, job_id: str) -> Path:
    fmt = output_format.lower().strip(".")
    ffmpeg = require_binary("ffmpeg")
    out_path = output_path(job_id, fmt)
    run_checked([ffmpeg, "-y", "-i", str(input_path), str(out_path)])
    return out_path


@router.post("/media")
async def media_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("mp4"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("convert", "media", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_media(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}


@router.post("/gif-to-mp4")
async def gif_to_mp4(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("convert", "gif-to-mp4", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_media(path, "mp4", job_id), input_path)
    return {"job_id": job_id, "status": "queued"}
