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
        import torch
        import torchaudio
        import torchaudio.transforms as T
        from core.gpu_utils import get_device
    except Exception as exc:
        raise NotImplementedError("torchaudio is required for pitch shifting") from exc

    device = get_device()
    
    # Load audio
    waveform, sr = torchaudio.load(input_path)
    if device == "cuda":
        waveform = waveform.cuda()
        
    # 1. GPU Pitch Shifting
    if semitones != 0:
        waveform = torchaudio.functional.pitch_shift(waveform, sr, n_steps=semitones)
        
    # 2. GPU Time Stretching (replaces CPU pedalboard.time_stretch)
    if speed != 1.0:
        n_fft = 2048
        hop_length = 512
        spec_transform = T.Spectrogram(n_fft=n_fft, hop_length=hop_length, power=None).to(device)
        time_stretch = T.TimeStretch(hop_length=hop_length, n_freq=n_fft // 2 + 1).to(device)
        inv_spec = T.InverseSpectrogram(n_fft=n_fft, hop_length=hop_length).to(device)
        
        spec = spec_transform(waveform)
        stretched = time_stretch(spec, 1.0 / speed)  # speed > 1 = faster = compress
        waveform = inv_spec(stretched)

    # 3. GPU Distortion — simple hard clipping / waveshaping
    if distortion > 0:
        gain = 1.0 + distortion * 20.0
        waveform = torch.tanh(waveform * gain) / max(torch.tanh(torch.tensor(gain)).item(), 1e-6)
    
    # 4. GPU Delay — add a delayed copy of the signal
    if delay > 0:
        delay_samples = int(0.5 * sr)  # 500ms delay
        feedback = delay
        mix = delay
        
        delayed = torch.zeros_like(waveform)
        if delay_samples < waveform.shape[-1]:
            delayed[..., delay_samples:] = waveform[..., :-delay_samples] * feedback
        waveform = waveform * (1.0 - mix) + (waveform + delayed) * mix
    
    # 5. GPU Reverb — simple convolution reverb using exponential decay IR
    if reverb > 0:
        ir_length = int(sr * reverb * 2)  # reverb tail length
        ir_length = max(1024, min(ir_length, sr * 3))  # clamp to 0.02s - 3s
        
        t = torch.linspace(0, 1, ir_length, device=waveform.device)
        ir = torch.randn(ir_length, device=waveform.device) * torch.exp(-t * (5.0 - reverb * 4.0))
        ir = ir / ir.norm()
        
        # Convolve each channel with IR using FFT (fast on GPU)
        import torch.nn.functional as F
        ir_kernel = ir.unsqueeze(0).unsqueeze(0)  # [1, 1, ir_length]
        
        wet_channels = []
        for ch in range(waveform.shape[0]):
            ch_data = waveform[ch:ch+1, :].unsqueeze(0)  # [1, 1, length]
            wet = F.conv1d(ch_data, ir_kernel, padding=ir_length // 2)
            wet_channels.append(wet.squeeze(0).squeeze(0)[:waveform.shape[-1]])
        
        wet = torch.stack(wet_channels)
        waveform = waveform * (1.0 - reverb * 0.5) + wet * (reverb * 0.5)
    
    # Normalize to prevent clipping
    peak = waveform.abs().max()
    if peak > 1.0:
        waveform = waveform / peak
        
    out_path = output_path(job_id, ".wav")
    torchaudio.save(str(out_path), waveform.cpu(), sr)
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

