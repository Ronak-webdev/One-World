from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job


router = APIRouter()


def process_convert(input_path: Path, output_format: str, job_id: str) -> Path:
    try:
        from PIL import Image
    except Exception as exc:
        raise NotImplementedError("Pillow is required for image format conversion") from exc

    fmt = output_format.lower().strip(".")
    out_path = output_path(job_id, fmt)
    save_format = "JPEG" if fmt in {"jpg", "jpeg"} else fmt.upper()
    
    with Image.open(input_path) as image:
        # Preserve alpha channel for formats that support it, otherwise convert to RGB
        if save_format in {"JPEG", "BMP"}:
            img_to_save = image.convert("RGB")
        elif image.mode in ("RGBA", "P"):
            img_to_save = image.convert("RGBA")
        else:
            img_to_save = image.convert("RGB")
            
        img_to_save.save(out_path, format=save_format, quality=95 if save_format in {"JPEG", "WEBP"} else None)
        
    return out_path

@router.post("/convert")
async def convert_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("png"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("image", "convert", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_convert(path, output_format, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}


