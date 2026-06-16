import zipfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.config import settings
from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def _process_single_image(source: Path, fmt: str) -> None:
    from PIL import Image
    out = source.with_suffix(f".{fmt}")
    with Image.open(source) as image:
        save_format = "JPEG" if fmt in {"jpg", "jpeg"} else fmt.upper()
        # Preserve alpha channel if possible
        if save_format in {"JPEG", "BMP"}:
            img_to_save = image.convert("RGB")
        elif image.mode in ("RGBA", "P"):
            img_to_save = image.convert("RGBA")
        else:
            img_to_save = image.convert("RGB")
            
        img_to_save.save(out, format=save_format, quality=95 if save_format in {"JPEG", "WEBP"} else None)
        
    if out != source:
        source.unlink(missing_ok=True)


def process_batch(input_path: Path, output_format: str, job_id: str) -> Path:
    from concurrent.futures import ThreadPoolExecutor

    if input_path.suffix.lower() != ".zip":
        raise RuntimeError("Batch processor expects a zip archive")

    work_dir = settings.output_dir / f"{job_id}-batch"
    work_dir.mkdir(parents=True, exist_ok=True)
    fmt = output_format.lower().strip(".")
    
    with zipfile.ZipFile(input_path) as zf:
        zf.extractall(work_dir)
        
    images_to_process = [
        source for source in work_dir.rglob("*") 
        if source.is_file() and source.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
    ]
    
    # Process images concurrently
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(_process_single_image, source, fmt) for source in images_to_process]
        for future in futures:
            future.result() # Raise any exceptions

    archive_base = output_path(job_id, ".zip").with_suffix("")
    import shutil
    return Path(shutil.make_archive(str(archive_base), "zip", work_dir))


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

