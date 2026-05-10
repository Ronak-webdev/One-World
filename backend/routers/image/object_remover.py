from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_object_remove(input_path: Path) -> Path:
    try:
        from PIL import Image, ImageFilter
    except Exception as exc:
        raise NotImplementedError("Pillow/OpenCV mask support is required for object removal") from exc

    out_path = output_path(input_path.stem, ".png")
    with Image.open(input_path) as image:
        image.convert("RGB").filter(ImageFilter.MedianFilter(size=3)).save(out_path)
    return out_path


@router.post("/remove-object")
async def remove_object(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="remove-object",
        processor=process_object_remove,
    )

