import shutil
import subprocess
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.config import settings
from core.file_handler import output_path
from core.job_queue import enqueue_upload_job, get_job

router = APIRouter()


def process_stems(input_path: Path) -> Path:
    demucs = shutil.which("demucs")
    if not demucs:
        raise NotImplementedError("demucs executable is not available on PATH")
    job_id = input_path.stem
    work_dir = settings.output_dir / f"{job_id}-stems"
    cmd = [demucs, "-n", "htdemucs", "--out", str(work_dir), str(input_path)]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "Demucs stem separation failed")
    
    # Organize and rename output files
    final_outputs = []
    job = get_job(job_id)
    orig_base = Path(job.original_filename).stem
    
    # Demucs outputs are typically in work_dir/htdemucs/job_id/
    search_dir = work_dir / "htdemucs" / job_id
    if not search_dir.exists():
        # Fallback to work_dir if structure is different
        search_dir = work_dir

    for p in search_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in (".wav", ".flac", ".mp3", ".m4a", ".ogg"):
            stem_name = p.stem
            new_name = f"{orig_base}_{stem_name.capitalize()}{p.suffix}"
            
            # Move to out_dir (flat)
            new_path = settings.output_dir / f"{job_id}_stems" / new_name
            new_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(p), str(new_path))
            
            final_outputs.append({
                "name": new_name,
                "label": stem_name.capitalize(),
                "path": str(new_path)
            })

    # Sort outputs: Vocals first, then Drums, Bass, Other
    label_order = {"Vocals": 0, "Drums": 1, "Bass": 2, "Other": 3}
    final_outputs.sort(key=lambda x: label_order.get(x["label"], 4))

    zip_base = output_path(job_id, ".zip").with_suffix("")
    # Zip the new flat directory
    zip_path = Path(shutil.make_archive(str(zip_base), "zip", settings.output_dir / f"{job_id}_stems"))
    
    return {
        "zip": zip_path,
        "outputs": final_outputs
    }


@router.post("/stem-separate")
async def stem_separate(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="audio",
        operation="stem-separate",
        processor=process_stems,
    )

