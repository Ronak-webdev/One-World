import zipfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.config import settings
from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def process_batch(input_path: Path, output_format: str, job_id: str) -> Path:
    try:
        from PIL import Image
    except Exception as exc:
        raise NotImplementedError("Pillow is required for batch image processing") from exc

    if input_path.suffix.lower() != ".zip":
        raise RuntimeError("Batch processor expects a zip archive")

    work_dir = settings.output_dir / f"{job_id}-batch"
    work_dir.mkdir(parents=True, exist_ok=True)
    fmt = output_format.lower().strip(".")
    with zipfile.ZipFile(input_path) as zf:
        zf.extractall(work_dir)
    for source in work_dir.rglob("*"):
        if source.is_file() and source.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            out = source.with_suffix(f".{fmt}")
            with Image.open(source) as image:
                save_format = "JPEG" if fmt in {"jpg", "jpeg"} else fmt.upper()
                image.convert("RGB" if save_format == "JPEG" else image.mode).save(out, format=save_format)
            if out != source:
                source.unlink(missing_ok=True)
    archive_base = output_path(job_id, ".zip").with_suffix("")
    return Path(__import__("shutil").make_archive(str(archive_base), "zip", work_dir))


@router.post("/batch")
async def batch(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("png"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("image", "batch", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_batch(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}

