import json
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.gpu_utils import get_device
from core.job_queue import create_job, run_job

router = APIRouter()


def process_transcribe(input_path: Path, model_name: str, job_id: str) -> Path:
    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        raise NotImplementedError("faster-whisper is required for transcription") from exc

    device = get_device()
    compute_type = "float16" if device == "cuda" else "int8"
    model = WhisperModel(model_name, device=device, compute_type=compute_type)
    segments, info = model.transcribe(str(input_path), word_timestamps=True)
    payload = {
        "language": info.language,
        "duration": info.duration,
        "segments": [
            {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": [word._asdict() for word in (segment.words or [])],
            }
            for segment in segments
        ],
    }
    out_path = output_path(job_id, ".json")
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return out_path


@router.post("/transcribe")
async def transcribe(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    whisper_model: str = Form("large-v3", alias="model_name"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "transcribe", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_transcribe(path, whisper_model, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}
