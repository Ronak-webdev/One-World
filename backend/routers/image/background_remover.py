from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.config import settings
from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_remove_background(input_path: Path) -> Path:
    try:
        from rembg import new_session, remove
    except Exception as exc:
        raise NotImplementedError("rembg is required for background removal") from exc

    session = new_session(settings.rembg_model)
    out_path = output_path(input_path.stem, ".png")
    out_path.write_bytes(remove(input_path.read_bytes(), session=session))
    return out_path


@router.post("/remove-background")
async def remove_background(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="remove-background",
        processor=process_remove_background,
    )

