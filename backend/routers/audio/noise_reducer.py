from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_denoise(input_path: Path) -> Path:
    try:
        import librosa
        import noisereduce as nr
        import soundfile as sf
    except Exception as exc:
        raise NotImplementedError("noisereduce, librosa, and soundfile are required for denoise") from exc

    job_id = input_path.stem
    y, sr = librosa.load(input_path, sr=None)
    reduced = nr.reduce_noise(y=y, sr=sr)
    out_path = output_path(job_id, ".wav")
    sf.write(out_path, reduced, sr)
    return out_path


@router.post("/denoise")
async def denoise(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="audio",
        operation="denoise",
        processor=process_denoise,
    )

