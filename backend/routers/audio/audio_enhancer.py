from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_enhance(input_path: Path) -> Path:
    raise NotImplementedError("Resemble-Enhance model invocation is scaffolded; install model weights before enabling this route")


@router.post("/enhance")
async def enhance_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="audio",
        operation="enhance",
        processor=process_enhance,
    )

