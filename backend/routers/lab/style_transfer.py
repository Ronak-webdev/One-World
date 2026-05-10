from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import add_status_download_routes, enqueue_upload_job

router = APIRouter()


def process_style_transfer(input_path: Path) -> Path:
    try:
        from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    except Exception as exc:
        raise NotImplementedError("Pillow is required for the lightweight style-transfer preview") from exc

    out_path = output_path(input_path.stem, ".png")
    with Image.open(input_path) as image:
        img = image.convert("RGB")
        edges = ImageOps.grayscale(img).filter(ImageFilter.FIND_EDGES).convert("RGB")
        stylized = Image.blend(ImageEnhance.Color(img).enhance(1.35), edges, 0.16)
        stylized = ImageEnhance.Contrast(stylized).enhance(1.18)
        stylized.save(out_path)
    return out_path


@router.post("/style-transfer")
async def style_transfer(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="lab",
        operation="style-transfer",
        processor=process_style_transfer,
    )


add_status_download_routes(router, "lab")

