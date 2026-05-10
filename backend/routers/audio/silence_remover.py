from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def process_silence(input_path: Path, threshold_db: int, padding_ms: int, job_id: str) -> Path:
    try:
        from pydub import AudioSegment, silence
    except Exception as exc:
        raise NotImplementedError("pydub is required for silence removal") from exc

    audio = AudioSegment.from_file(input_path)
    ranges = silence.detect_nonsilent(audio, min_silence_len=350, silence_thresh=threshold_db)
    if not ranges:
        raise RuntimeError("No non-silent sections detected")

    output = AudioSegment.empty()
    for start, end in ranges:
        output += audio[max(0, start - padding_ms) : min(len(audio), end + padding_ms)]

    out_path = output_path(job_id, ".wav")
    output.export(out_path, format="wav")
    return out_path


@router.post("/remove-silence")
async def remove_silence(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    threshold_db: int = Form(-40),
    padding_ms: int = Form(120),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "remove-silence", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_silence(path, threshold_db, padding_ms, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}

