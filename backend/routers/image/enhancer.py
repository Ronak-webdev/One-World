import urllib.request
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()

# Global cache for GFPGAN to prevent reloading
_gfpgan_model = None

def get_gfpgan_model():
    global _gfpgan_model
    if _gfpgan_model is None:
        from core.config import settings
        import torch
        from core.gpu_utils import get_device
        from gfpgan import GFPGANer
        
        model_path = settings.output_dir.parent / "models" / "GFPGANv1.4.pth"
        if not model_path.exists():
            print(f"Downloading GFPGAN weights to {model_path}...")
            model_path.parent.mkdir(parents=True, exist_ok=True)
            url = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth"
            urllib.request.urlretrieve(url, str(model_path))
            print("Download complete.")
            
        device = torch.device(get_device()) if get_device() == 'cuda' else None
        print(f"[GFPGAN] Loading to {device}...")
        _gfpgan_model = GFPGANer(
            model_path=str(model_path),
            upscale=2, # Modest 2x upscale with face enhancement
            arch='clean',
            channel_multiplier=2,
            bg_upsampler=None,
            device=device
        )
    return _gfpgan_model


def process_enhance(
    input_path: Path, 
    job_id: str,
    preset: str = "natural", 
    intensity: int = 70, 
    noise_reduction: int = 40, 
    face_restore: str = "false", 
    hdr: str = "false"
) -> Path:
    try:
        import torch
        import cv2
        import numpy as np
        from core.gpu_utils import get_device, clear_vram, get_autocast_context
    except Exception as exc:
        raise NotImplementedError("opencv-python is required for image enhancement") from exc

    out_path = output_path(job_id, ".png")
    img = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Invalid image file")

    # 1. Noise Reduction
    if noise_reduction > 0:
        h_val = float(noise_reduction) / 5.0
        img = cv2.fastNlMeansDenoisingColored(img, None, h=h_val, hColor=h_val, templateWindowSize=7, searchWindowSize=21)
        
    # 2. HDR Enhancement
    if hdr == "true":
        img = cv2.detailEnhance(img, sigma_s=12, sigma_r=0.15)
        
    # 3. Presets
    if preset == "cinematic":
        img = cv2.convertScaleAbs(img, alpha=1.1, beta=-10)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv[:,:,1] = cv2.multiply(hsv[:,:,1], 1.1)
        img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    elif preset == "studio":
        img = cv2.convertScaleAbs(img, alpha=1.05, beta=5)
    elif preset == "ultra":
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]]) * 0.1 + np.array([[0,0,0], [0,1,0], [0,0,0]]) * 0.9
        img = cv2.filter2D(img, -1, kernel)

    # 4. Face Restoration (GFPGAN)
    if face_restore == "true":
        restorer = get_gfpgan_model()
        weight = float(intensity) / 100.0
        device = get_device()
        
        with torch.inference_mode(), get_autocast_context(device):
            cropped_faces, restored_faces, restored_img = restorer.enhance(
                img,
                has_aligned=False,
                only_center_face=False,
                paste_back=True,
                weight=weight
            )
            if restored_img is not None:
                img = restored_img
    else:
        # If no face restore but intensity is high, we can blend a sharpened version
        if intensity > 50:
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharp = cv2.filter2D(img, -1, kernel)
            alpha = (intensity - 50) / 100.0
            img = cv2.addWeighted(img, 1 - alpha, sharp, alpha, 0)

    cv2.imwrite(str(out_path), img)
    clear_vram()
    return out_path


@router.post("/enhance")
async def enhance(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    preset: str = Form("natural"),
    intensity: int = Form(70),
    noise_reduction: int = Form(40),
    face_restore: str = Form("false"),
    hdr: str = Form("false")
) -> dict:
    def custom_processor(in_path: Path, **kwargs) -> Path:
        return process_enhance(in_path, preset=preset, intensity=intensity, noise_reduction=noise_reduction, face_restore=face_restore, hdr=hdr, **kwargs)
        
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="enhance",
        processor=custom_processor,
    )

