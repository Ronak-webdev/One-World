from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, UploadFile
from core.file_handler import output_path
from core.config import settings

router = APIRouter()

def process_stem_separation(input_path: Path, job_id: str) -> dict[str, Path]:
    import subprocess
    import shutil
    from core.config import settings
    
    # Demucs output directory
    out_dir = settings.output_dir / job_id
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[Backend] Running Demucs for job {job_id} on {input_path}")
    try:
        # Use demucs as a subprocess to keep memory clean and see real-time progress in console
        # htdemucs is the default high-quality model
        cmd = [
            "python", "-m", "demucs.separate",
            "-n", "htdemucs",
            "--out", str(out_dir),
            str(input_path)
        ]
        
        # Add GPU flag if enabled
        if settings.gpu_enabled:
            cmd.insert(3, "-d")
            cmd.insert(4, "cuda")
            
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"[Backend] Demucs finished for job {job_id}")
        
        # Demucs creates: out_dir / htdemucs / input_filename_stem / [drums, bass, vocals, other].wav
        # We need to find these and move them to a flatter structure or just map them
        model_name = "htdemucs"
        track_name = input_path.stem
        search_dir = out_dir / model_name / track_name
        
        stems = {}
        for stem in ["drums", "bass", "vocals", "other"]:
            found_path = search_dir / f"{stem}.wav"
            if found_path.exists():
                # Move to the final output name we expect
                final_path = settings.output_dir / f"{job_id}_{stem}.wav"
                shutil.move(str(found_path), str(final_path))
                stems[stem] = final_path
        
        # Cleanup demucs temp dir
        shutil.rmtree(out_dir, ignore_errors=True)
        
        if not stems:
            raise RuntimeError("Demucs failed to produce any stems")
            
        # Cleanup input file
        if "uploads" in str(input_path):
            input_path.unlink(missing_ok=True)
            
        return stems
        
    except subprocess.CalledProcessError as e:
        print(f"[Backend] Demucs Error: {e.stderr}")
        raise RuntimeError(f"Demucs process failed: {e.stderr}")

@router.post("/stem-separate")
async def stem_separate(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    from core.file_handler import save_upload
    from core.job_queue import create_job, run_job
    
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "stem-separate", job_id, original_filename)
    
    background_tasks.add_task(
        run_job, 
        job_id, 
        process_stem_separation, 
        input_path
    )
    
    return {"job_id": job_id, "status": "queued"}
