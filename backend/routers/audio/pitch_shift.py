from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def process_pitch_shift(
    input_path: Path, 
    semitones: float, 
    speed: float,
    reverb: float,
    delay: float,
    distortion: float,
    job_id: str
) -> Path:
    try:
        import soundfile as sf
        import pedalboard
        from pedalboard import Pedalboard, PitchShift, Reverb, Delay, Distortion
    except Exception as exc:
        raise NotImplementedError("soundfile and pedalboard are required for pitch shifting") from exc

    y, sr = sf.read(input_path)
    if y.ndim > 1:
        y = y.T
    
    # Process speed & pitch first using high-quality stretch
    if semitones != 0 or speed != 1.0:
        y = pedalboard.time_stretch(
            input_audio=y,
            samplerate=sr,
            stretch_factor=speed,
            pitch_shift_in_semitones=semitones,
            high_quality=True
        )

    board = Pedalboard()
    if distortion > 0:
        board.append(Distortion(drive_db=distortion * 20)) # scale to dB
    if delay > 0:
        board.append(Delay(delay_seconds=0.5, feedback=delay, mix=delay))
    if reverb > 0:
        board.append(Reverb(room_size=reverb, wet_level=reverb))

    shifted = board(y, sr, reset=False)

    out_path = output_path(job_id, ".wav")
    sf.write(out_path, shifted.T if getattr(shifted, "ndim", 1) > 1 else shifted, sr)
    return out_path


@router.post("/pitch-shift")
async def pitch_shift_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    semitones: float = Form(0),
    speed: float = Form(1.0),
    reverb: float = Form(0.0),
    delay: float = Form(0.0),
    distortion: float = Form(0.0),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "pitch-shift", job_id, original_filename)
    background_tasks.add_task(
        run_job, 
        job_id, 
        lambda path: process_pitch_shift(path, semitones, speed, reverb, delay, distortion, job_id), 
        input_path
    )
    return {"job_id": job_id, "status": "queued"}

