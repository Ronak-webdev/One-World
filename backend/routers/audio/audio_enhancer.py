import json
import logging
import subprocess
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.job_queue import enqueue_upload_job, update_job_partial

router = APIRouter()

logger = logging.getLogger(__name__)

def process_enhance(
    input_path: Path, 
    job_id: str, 
    intensity: float = 0.7, 
    noise_reduction: float = 0.5,
    preset: str = "balanced"
) -> dict:
    """
    High-performance GPU-accelerated audio enhancement using PyTorch.
    """
    output_dir = input_path.parent
    enhanced_path = output_dir / f"{job_id}_enhanced.wav"
    
    try:
        import torch
        import torchaudio
        import torchaudio.transforms as T
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device} for audio enhancement")
        
        # Load audio directly to GPU
        waveform, sample_rate = torchaudio.load(str(input_path))
        waveform = waveform.to(device)
        
        # 1. Neural Spectral Gating (Simplified for speed)
        # Transform to frequency domain
        n_fft = 2048
        win_length = None
        hop_length = 512
        spec_fn = T.Spectrogram(n_fft=n_fft, win_length=win_length, hop_length=hop_length, power=None).to(device)
        spec = spec_fn(waveform)
        
        # Apply magnitude enhancement (Clarity Boost)
        mag = spec.abs()
        phase = spec.angle()
        
        # Boost high frequencies for "Studio" presets
        if preset in ["studio", "podcast"]:
            freqs = torch.linspace(0, sample_rate / 2, mag.size(-2)).to(device)
            # Create a high-shelf boost curve
            boost = 1.0 + (intensity * 0.5) * (freqs / (sample_rate / 2))
            mag = mag * boost.unsqueeze(0).unsqueeze(-1)
            
        # Basic Noise Gating
        if noise_reduction > 0:
            threshold = 0.05 * noise_reduction
            mask = (mag > (mag.mean() * threshold)).float()
            mag = mag * mask
            
        # Transform back to time domain
        enhanced_spec = torch.polar(mag, phase)
        inverse_spec_fn = T.InverseSpectrogram(n_fft=n_fft, win_length=win_length, hop_length=hop_length).to(device)
        enhanced_waveform = inverse_spec_fn(enhanced_spec)
        
        # Normalize
        enhanced_waveform = enhanced_waveform / (enhanced_waveform.abs().max() + 1e-8)
        
        # Save output
        torchaudio.save(str(enhanced_path), enhanced_waveform.cpu(), sample_rate)
        
        return {
            "enhanced": enhanced_path,
            "original": input_path,
            "settings": {
                "intensity": intensity,
                "noise_reduction": noise_reduction,
                "preset": preset,
                "device": str(device)
            }
        }
        
    except Exception as e:
        logger.warning(f"Torch enhancement failed, falling back to FFmpeg: {e}")
        # Fallback to the reliable FFmpeg pipeline
        presets = {
            "podcast": "afftdn=nf=-25,anequalizer=c0 f=100 g=3 t=1|c0 f=3000 g=4 t=1,compand=attacks=0:points=-80/-80|-20/-20|-15/-10|0/-7",
            "studio": "afftdn=nf=-30,anequalizer=c0 f=80 g=-5 t=1|c0 f=5000 g=3 t=1,compand=attacks=0:points=-80/-80|-25/-25|-15/-10|0/-6",
            "clean": "afftdn=nf=-20,highpass=f=80,lowpass=f=15000,arnndn=model=cb",
            "balanced": "afftdn=nf=-25,compand=attacks=0:points=-80/-80|-20/-20|0/-10"
        }
        filter_chain = presets.get(preset, presets["balanced"])
        
        cmd = ["ffmpeg", "-y", "-hwaccel", "cuda", "-i", str(input_path), "-af", filter_chain, "-ar", "44100", "-ac", "2", str(enhanced_path)]
        subprocess.run(cmd, check=True, capture_output=True)
        
        return {"enhanced": enhanced_path, "original": input_path, "fallback": True}


@router.post("/enhance")
async def enhance_audio(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    intensity: float = Form(0.7),
    noise_reduction: float = Form(0.5),
    preset: str = Form("balanced")
) -> dict:
    """
    Starts an audio enhancement job.
    Uses GPU-accelerated FFmpeg logic where possible.
    """
    # Manually handle job creation to ensure params are passed to processor
    from core.file_handler import save_upload
    from core.job_queue import create_job, run_job, JobStatus
    
    job_id, input_path, original_filename = await save_upload(file)
    create_job("audio", "enhance", job_id, original_filename)
    
    # Pass params directly to run_job (job_id is automatically handled by the runner)
    background_tasks.add_task(
        run_job, 
        job_id, 
        process_enhance, 
        input_path, 
        intensity=intensity,
        noise_reduction=noise_reduction,
        preset=preset
    )
    
    return {"job_id": job_id, "status": JobStatus.QUEUED}

