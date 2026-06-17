from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_denoise(input_path: Path, job_id: str) -> Path:
    try:
        import torch
        import torchaudio
        import torchaudio.transforms as T
        from core.gpu_utils import get_device
    except Exception as exc:
        raise NotImplementedError("torchaudio is required for GPU denoise") from exc

    device = get_device()
    waveform, sr = torchaudio.load(input_path)
    if device == "cuda":
        waveform = waveform.cuda()
        
    # GPU-accelerated Spectral Noise Gating
    n_fft = 2048
    hop_length = 512
    spec_fn = T.Spectrogram(n_fft=n_fft, hop_length=hop_length, power=None).to(device)
    spec = spec_fn(waveform)
    
    mag = spec.abs()
    phase = spec.angle()
    
    # Calculate noise profile from the quietest parts (e.g. bottom 10% of frames)
    # Simple gating: attenuate bins below a threshold
    threshold = mag.mean() * 0.1
    mask = (mag > threshold).float()
    
    # Smooth the mask over time to reduce artifacts
    mask = torch.nn.functional.avg_pool2d(mask.unsqueeze(0), kernel_size=(1, 5), stride=1, padding=(0, 2)).squeeze(0)
    
    mag = mag * mask
    enhanced_spec = torch.polar(mag, phase)
    
    inverse_spec_fn = T.InverseSpectrogram(n_fft=n_fft, hop_length=hop_length).to(device)
    reduced = inverse_spec_fn(enhanced_spec)
    
    # Match length and normalize
    if reduced.shape[-1] > waveform.shape[-1]:
        reduced = reduced[..., :waveform.shape[-1]]
    elif reduced.shape[-1] < waveform.shape[-1]:
        import torch.nn.functional as F
        reduced = F.pad(reduced, (0, waveform.shape[-1] - reduced.shape[-1]))
        
    out_path = output_path(job_id, ".wav")
    torchaudio.save(str(out_path), reduced.cpu(), sr)
    return out_path


@router.post("/denoise")
async def denoise(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="audio",
        operation="denoise",
        processor=lambda p: process_denoise(p, p.stem),
    )

