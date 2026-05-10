from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def process_pitch_shift(input_path: Path, semitones: float, job_id: str) -> Path:
    try:
        import librosa
        import soundfile as sf
    except Exception as exc:
        raise NotImplementedError("librosa and soundfile are required for pitch shifting") from exc

    y, sr = librosa.load(input_path, sr=None, mono=False)
    shifted = librosa.effects.pitch_shift(y=y, sr=sr, n_steps=semitones)
    out_path = output_path(job_id, ".wav")
    sf.write(out_path, shifted.T if getattr(shifted, "ndim", 1) > 1 else shifted, sr)
    return out_path


@router.post("/pitch-shift")
async def pitch_shift(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    semitones: float = Form(0),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "pitch-shift", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_pitch_shift(path, semitones, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}

