import urllib.request
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.config import settings
from core.file_handler import output_path
from core.gpu_utils import get_device, clear_vram, get_autocast_context
from core.job_queue import enqueue_upload_job

router = APIRouter()

# Global caches
_esrgan_models = {}
_gfpgan_model = None

def get_esrgan_model(scale: int):
    global _esrgan_models
    if scale not in _esrgan_models:
        import torch
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from realesrgan import RealESRGANer
        
        if scale <= 2:
            model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"
            model_name = "RealESRGAN_x2plus.pth"
            model_scale = 2
        else:
            model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
            model_name = "RealESRGAN_x4plus.pth"
            model_scale = 4

        model_path = settings.output_dir.parent / "models" / model_name
        if not model_path.exists():
            print(f"Downloading {model_name}...")
            model_path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(model_url, str(model_path))
            print("Download complete.")
            
        device = get_device()
        is_half = device == "cuda"
        
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=model_scale)
        bg_upsampler = RealESRGANer(
            scale=model_scale,
            model_path=str(model_path),
            model=model,
            tile=400,
            tile_pad=10,
            pre_pad=0,
            half=is_half,
            device=torch.device(device) if device == "cuda" else None
        )
        print(f"[RealESRGAN x{model_scale}] Loaded on {device}")
        _esrgan_models[scale] = bg_upsampler
        
    return _esrgan_models[scale]

def get_gfpgan_model():
    global _gfpgan_model
    if _gfpgan_model is None:
        import torch
        from gfpgan import GFPGANer
        
        gfpgan_path = settings.output_dir.parent / "models" / "GFPGANv1.4.pth"
        if not gfpgan_path.exists():
            print(f"Downloading GFPGAN weights to {gfpgan_path}...")
            gfpgan_path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve("https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth", str(gfpgan_path))
            
        device = get_device()
        _gfpgan_model = GFPGANer(
            model_path=str(gfpgan_path),
            upscale=2, # Internal upscale, will be overridden
            arch='clean',
            channel_multiplier=2,
            bg_upsampler=None, # We'll run it sequentially to avoid tying it to a specific ESRGAN instance
            device=torch.device(device) if device == "cuda" else None
        )
        print(f"[GFPGAN] Loaded on {device}")
    return _gfpgan_model

def process_upscale(input_path: Path, job_id: str, scale: int = 4, face_enhance: str = "false", sharpness: int = 0) -> Path:
    try:
        import cv2
        import numpy as np
        import torch
    except ImportError as e:
        raise NotImplementedError("Required libraries are missing") from e

    out_path = output_path(job_id, ".png")
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Invalid image file")
        
    device = get_device()
    bg_upsampler = get_esrgan_model(scale)
    
    with torch.inference_mode(), get_autocast_context(device):
        # 1. Background Upscale
        output, _ = bg_upsampler.enhance(img, outscale=scale)
        
        # 2. Face Enhancement
        if face_enhance == "true":
            try:
                restorer = get_gfpgan_model()
                _, _, face_output = restorer.enhance(
                    output, 
                    has_aligned=False, 
                    only_center_face=False, 
                    paste_back=True,
                    weight=0.5
                )
                if face_output is not None:
                    output = face_output
            except Exception as e:
                print(f"GFPGAN failed: {e}")
                
    # 3. Post-process Sharpening
    if sharpness > 0:
        strength = sharpness / 100.0
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]]) * strength + np.array([[0,0,0], [0,1,0], [0,0,0]]) * (1 - strength)
        output = cv2.filter2D(output, -1, kernel)

    cv2.imwrite(str(out_path), output)
    clear_vram()
    return out_path


@router.post("/upscale")
async def upscale(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    scale: int = Form(4),
    face_enhance: str = Form("false"),
    sharpness: int = Form(0)
) -> dict:
    def custom_processor(in_path: Path, **kwargs) -> Path:
        return process_upscale(in_path, scale=scale, face_enhance=face_enhance, sharpness=sharpness, **kwargs)
        
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="upscale",
        processor=custom_processor,
    )
