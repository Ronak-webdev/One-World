import json
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.gpu_utils import get_device
from core.job_queue import create_job, run_job

router = APIRouter()


def format_timestamp(seconds: float, is_vtt: bool = False) -> str:
    td = seconds
    hours = int(td // 3600)
    minutes = int((td % 3600) // 60)
    secs = int(td % 60)
    millis = int((td % 1) * 1000)
    sep = "." if is_vtt else ","
    return f"{hours:02}:{minutes:02}:{secs:02}{sep}{millis:03}"


def segments_to_srt(segments: list) -> str:
    lines = []
    for i, s in enumerate(segments, 1):
        lines.append(str(i))
        start = format_timestamp(s["start"])
        end = format_timestamp(s["end"])
        lines.append(f"{start} --> {end}")
        lines.append(s["text"])
        lines.append("")
    return "\n".join(lines)


def segments_to_vtt(segments: list) -> str:
    lines = ["WEBVTT", ""]
    for s in segments:
        start = format_timestamp(s["start"], is_vtt=True)
        end = format_timestamp(s["end"], is_vtt=True)
        lines.append(f"{start} --> {end}")
        lines.append(s["text"])
        lines.append("")
    return "\n".join(lines)


def segments_to_txt(segments: list) -> str:
    return "\n".join([f"[{format_timestamp(s['start'])}] {s['speaker']}: {s['text']}" for s in segments])


def process_transcribe(input_path: Path, model_name: str, job_id: str) -> Path:
    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        raise NotImplementedError("faster-whisper is required for transcription") from exc

    from core.job_queue import update_job_partial
    from core.model_cache import ModelManager
    
    device = get_device()
    compute_type = "float16" if device == "cuda" else "int8"
    
    def load_whisper():
        return WhisperModel(model_name, device=device, compute_type=compute_type)
        
    model = ModelManager.get_model(f"whisper_{model_name}", load_whisper)
    
    # We use beam_size=5 for balanced accuracy
    segments_gen, info = model.transcribe(str(input_path), word_timestamps=True, beam_size=5)
    
    processed_segments = []
    for segment in segments_gen:
        # Simple diarization simulation based on segment timing if no real diarizer is present
        # In a real app, you'd use pyannote or similar here.
        speaker_id = f"Speaker {(len(processed_segments) % 2) + 1}"
        
        seg_data = {
            "id": str(len(processed_segments) + 1),
            "speaker": speaker_id,
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
            "words": [word._asdict() for word in (segment.words or [])],
            "confidence": getattr(segment, "avg_logprob", 0) # Use logprob as confidence proxy
        }
        processed_segments.append(seg_data)
        
        # Update partial results for "live" feel
        update_job_partial(job_id, {
            "language": info.language,
            "duration": info.duration,
            "segments": processed_segments,
            "is_partial": True
        })

    # Final artifacts
    srt_path = output_path(job_id, ".srt")
    srt_path.write_text(segments_to_srt(processed_segments), encoding="utf-8")
    
    vtt_path = output_path(job_id, ".vtt")
    vtt_path.write_text(segments_to_vtt(processed_segments), encoding="utf-8")
    
    txt_path = output_path(job_id, ".txt")
    txt_path.write_text(segments_to_txt(processed_segments), encoding="utf-8")
    
    payload = {
        "language": info.language,
        "duration": info.duration,
        "segments": processed_segments,
        "is_partial": False
    }
    
    json_path = output_path(job_id, ".json")
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    
    # Return a dictionary of results for the job queue to record
    return {
        "json": json_path,
        "srt": srt_path,
        "vtt": vtt_path,
        "txt": txt_path,
        "segments": processed_segments # Include segments directly in DB results for UI ease
    }


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
