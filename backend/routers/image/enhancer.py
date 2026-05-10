from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_enhance(input_path: Path) -> Path:
    try:
        from PIL import Image, ImageEnhance, ImageFilter
    except Exception as exc:
        raise NotImplementedError("Pillow is required for image enhancement") from exc

    out_path = output_path(input_path.stem, ".png")
    with Image.open(input_path) as image:
        enhanced = ImageEnhance.Contrast(image.convert("RGB")).enhance(1.08)
        enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.18)
        enhanced.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=3)).save(out_path)
    return out_path


@router.post("/enhance")
async def enhance(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="enhance",
        processor=process_enhance,
    )

