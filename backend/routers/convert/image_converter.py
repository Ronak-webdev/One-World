import zipfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.config import settings
from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def convert_one(input_path: Path, output_format: str, job_id: str) -> Path:
    try:
        from PIL import Image
    except Exception as exc:
        raise NotImplementedError("Pillow is required for image conversion") from exc

    fmt = output_format.lower().strip(".")
    out_path = output_path(job_id, fmt)
    with Image.open(input_path) as image:
        save_format = "JPEG" if fmt in {"jpg", "jpeg"} else fmt.upper()
        image.convert("RGB" if save_format == "JPEG" else image.mode).save(out_path, format=save_format)
    return out_path


def convert_zip(input_path: Path, output_format: str, job_id: str) -> Path:
    if input_path.suffix.lower() != ".zip":
        raise RuntimeError("Batch image conversion expects a zip archive")
    try:
        from PIL import Image
    except Exception as exc:
        raise NotImplementedError("Pillow is required for image conversion") from exc

    work_dir = settings.output_dir / f"{job_id}-convert-images"
    work_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(input_path) as zf:
        zf.extractall(work_dir)
    for path in work_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}:
            convert_one(path, output_format, f"{job_id}-{path.stem}")
    archive = __import__("shutil").make_archive(str(output_path(job_id, ".zip").with_suffix("")), "zip", settings.output_dir, f"{job_id}-convert-images")
    return Path(archive)


@router.post("/image")
async def image_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("png"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("convert", "image", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: convert_one(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}


@router.post("/image/batch")
async def image_batch_convert(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("png"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("convert", "image-batch", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: convert_zip(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}

