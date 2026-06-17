from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()


def process_silence(input_path: Path, threshold_db: int, padding_ms: int, job_id: str) -> Path:
    try:
        import torch
        import torchaudio
        from core.gpu_utils import get_device
    except Exception as exc:
        raise NotImplementedError("torchaudio is required for GPU silence removal") from exc

    device = get_device()
    waveform, sr = torchaudio.load(input_path)
    if device == "cuda":
        waveform = waveform.cuda()
        
    # Convert db threshold to linear amplitude
    threshold = 10 ** (threshold_db / 20.0)
    
    # Calculate RMS in windows to detect silence
    # Window size: 50ms
    win_length = int(sr * 0.05)
    
    # Square waveform for power
    power = waveform ** 2
    
    # Pool to get RMS per window
    # We do this per channel, then average channels
    import torch.nn.functional as F
    
    # Need shape (batch=1, channels, length) for pooling
    power_pooled = F.avg_pool1d(power.unsqueeze(0), kernel_size=win_length, stride=win_length).squeeze(0)
    rms = torch.sqrt(power_pooled.mean(dim=0))
    
    # Find non-silent windows
    is_speech = rms > threshold
    
    # If all silent, return original or error
    if not is_speech.any():
        raise RuntimeError("No non-silent sections detected")
        
    # We need to reconstruct the audio. The simplest way in PyTorch is to expand the mask back to the original resolution
    # and use it to index the waveform.
    # To add padding, we can use max_pool1d on the mask
    pad_windows = int((padding_ms / 1000.0) * sr / win_length)
    if pad_windows > 0:
        is_speech = is_speech.float().unsqueeze(0).unsqueeze(0)
        is_speech = F.max_pool1d(is_speech, kernel_size=pad_windows*2+1, stride=1, padding=pad_windows)
        is_speech = is_speech.squeeze() > 0.5
        
    # Upsample mask to original length
    mask_upsampled = is_speech.repeat_interleave(win_length)
    
    # Ensure lengths match
    if len(mask_upsampled) < waveform.shape[1]:
        mask_upsampled = F.pad(mask_upsampled, (0, waveform.shape[1] - len(mask_upsampled)), value=False)
    else:
        mask_upsampled = mask_upsampled[:waveform.shape[1]]
        
    # Extract non-silent parts
    # We do this channel by channel
    out_channels = []
    for c in range(waveform.shape[0]):
        out_channels.append(waveform[c][mask_upsampled])
        
    output = torch.stack(out_channels)
    
    out_path = output_path(job_id, ".wav")
    torchaudio.save(str(out_path), output.cpu(), sr)
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

