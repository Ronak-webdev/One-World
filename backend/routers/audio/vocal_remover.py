import shutil
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path
from core.gpu_utils import get_device
from core.job_queue import add_status_download_routes, create_job, run_job
from core.file_handler import save_upload

router = APIRouter()
logger = logging.getLogger(__name__)

def process_vocal_separation(input_path: Path, job_id: str, output_format: str = "wav") -> dict[str, Path]:
    """
    Performs high-quality vocal separation using audio-separator.
    Optimized for GPU acceleration and production-ready file handling.
    """
    try:
        from audio_separator.separator import Separator
    except ImportError:
        logger.error("audio-separator not installed")
        raise RuntimeError("audio-separator library is missing. Please install it.")

    # Initialize separator with GPU support if available
    device = get_device()
    logger.info(f"Starting vocal separation on {device} for job {job_id}")
    
    # Configure separator
    # We use MDX-NET as it's currently the best for vocal removal
    separator = Separator(
        output_dir=str(input_path.parent),
        output_format=output_format.lower().strip("."),
        normalization_threshold=0.9,
    )
    
    # Load model (UVRL-MDX-NET-Voc_FT is excellent for vocals)
    separator.load_model(model_filename='UVR-MDX-NET-Voc_FT.onnx')
    
    # Run separation
    output_files = separator.separate(str(input_path))
    
    # Map output files to specific keys (vocals, instrumental)
    results = {}
    for f_name in output_files:
        f_path = Path(input_path.parent) / f_name
        if not f_path.exists():
            continue
            
        # Clean naming and move to output directory
        if "Vocals" in f_name:
            target = output_path(job_id, f"vocals{f_path.suffix}")
            shutil.move(str(f_path), str(target))
            results["vocals"] = target
        elif "Instrumental" in f_name:
            target = output_path(job_id, f"instrumental{f_path.suffix}")
            shutil.move(str(f_path), str(target))
            results["instrumental"] = target
            
    # Cleanup input file
    if input_path.exists():
        input_path.unlink()
        
    return results

@router.post("/vocal-remove")
async def vocal_remove(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form("wav")
) -> dict:
    """
    Endpoint for professional vocal removal.
    Returns a job_id for status tracking.
    """
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "vocal-remove", job_id, original_filename)
    
    # Enqueue the job with the specified output format
    background_tasks.add_task(
        run_job, 
        job_id, 
        process_vocal_separation, 
        input_path, 
        output_format=output_format
    )
    
    return {"job_id": job_id, "status": "queued"}
