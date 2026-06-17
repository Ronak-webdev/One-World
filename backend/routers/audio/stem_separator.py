from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, UploadFile
from core.file_handler import output_path
from core.config import settings

router = APIRouter()

def get_demucs_model():
    from core.model_cache import ModelManager
    
    def load_demucs():
        try:
            from demucs.pretrained import get_model
        except ImportError:
            raise RuntimeError("demucs is missing")
            
        print("[Backend] Loading Demucs model (htdemucs)...")
        model = get_model('htdemucs')
        
        from core.gpu_utils import get_device
        device = get_device()
        if device == "cuda":
            model.cuda()
            
        return model
        
    return ModelManager.get_model("htdemucs", load_demucs)

def process_stem_separation(input_path: Path, job_id: str) -> dict[str, Path]:
    try:
        import torch
        import torchaudio
        from demucs.apply import apply_model
        from core.config import settings
        from core.gpu_utils import get_device
    except Exception as exc:
        raise NotImplementedError("demucs and torchaudio are required") from exc

    device = get_device()
    model = get_demucs_model()
    
    # Load audio
    wav, sr = torchaudio.load(input_path)
    if device == "cuda":
        wav = wav.cuda()
        
    # Convert to Demucs expected shape: [batch, channels, length] and match sample rate
    if sr != model.samplerate:
        wav = torchaudio.functional.resample(wav, sr, model.samplerate)
        sr = model.samplerate
        
    wav = wav.unsqueeze(0) # Add batch dimension
    
    # Run separation
    print(f"[Backend] Running Demucs separation on {device}")
    with torch.inference_mode():
        sources = apply_model(model, wav, shifts=1, split=True, overlap=0.25)
        
    sources = sources.squeeze(0) # Remove batch dimension [sources, channels, length]
    
    stems = {}
    for i, name in enumerate(model.sources):
        final_path = settings.output_dir / f"{job_id}_{name}.wav"
        torchaudio.save(str(final_path), sources[i].cpu(), sr)
        stems[name] = final_path
        
    if not stems:
        raise RuntimeError("Demucs failed to produce any stems")
        
    # Cleanup input file
    if "uploads" in str(input_path):
        input_path.unlink(missing_ok=True)
        
    return stems

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
