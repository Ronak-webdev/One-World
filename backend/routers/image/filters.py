from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile
import numpy as np
import cv2

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_filter(
    input_path: Path,
    job_id: str,
    brightness: float = 0,
    contrast: float = 0,
    saturation: float = 0,
    exposure: float = 0,
    highlights: float = 0,
    shadows: float = 0,
    temperature: float = 0,
    tint: float = 0,
    vibrance: float = 0,
    sharpness: float = 0,
    blur: float = 0,
    vignette: float = 0,
    grain: float = 0,
    sepia: float = 0,
    hue: float = 0,
    bloom: float = 0,
    clarity: float = 0
) -> Path:
    import torch
    import torch.nn.functional as F
    from core.gpu_utils import get_device
    
    out_path = output_path(job_id, ".png")
    img = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")

    device = get_device()
    
    # Convert to GPU tensor: [1, C, H, W] float32 in [0, 1]
    img_t = torch.from_numpy(img.transpose(2, 0, 1).astype(np.float32) / 255.0).unsqueeze(0)
    if device == "cuda":
        img_t = img_t.cuda()

    # 1. Exposure & Brightness — simple gain + offset
    exp_factor = 1.0 + (exposure / 100.0)
    bright_offset = brightness / 255.0 * 2
    img_t = img_t * exp_factor + bright_offset

    # 2. Contrast & Clarity — scale around mean
    cont_factor = 1.0 + ((contrast + clarity * 0.5) / 100.0)
    mean_val = img_t.mean()
    img_t = (img_t - mean_val) * cont_factor + mean_val

    # 2.5 Highlights & Shadows
    if highlights != 0 or shadows != 0:
        # Compute luminosity
        gray = img_t.mean(dim=1, keepdim=True)  # [1, 1, H, W]
        h_mask = torch.clamp((gray - 0.5) * 2, 0, 1)
        s_mask = torch.clamp((0.5 - gray) * 2, 0, 1)
        h_gain = highlights / 200.0
        s_gain = shadows / 200.0
        img_t = img_t + img_t * h_mask * h_gain + img_t * s_mask * s_gain

    # 3. Temperature & Tint — channel-wise offset
    if temperature != 0 or tint != 0:
        # BGR format: [B, G, R]
        offsets = torch.tensor([
            -temperature * 0.5 / 255.0,  # Blue
            tint * 0.5 / 255.0,          # Green
            temperature * 0.5 / 255.0    # Red
        ], device=img_t.device).view(1, 3, 1, 1)
        img_t = img_t + offsets

    # 4. Saturation, Vibrance & Hue — in HSV space on GPU
    if saturation != 0 or vibrance != 0 or hue != 0:
        # Convert BGR to RGB to HSV manually on GPU
        # Simple approach: convert to/from numpy just for color conversion
        img_np = torch.clamp(img_t, 0, 1).squeeze(0).cpu().numpy().transpose(1, 2, 0)
        img_np = (img_np * 255).astype(np.uint8)
        hsv = cv2.cvtColor(img_np, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:,:,0] = (hsv[:,:,0] + hue/2) % 180
        sat_mult = 1.0 + (saturation + vibrance * 0.5) / 100.0
        hsv[:,:,1] = np.clip(hsv[:,:,1] * sat_mult, 0, 255)
        img_np = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        img_t = torch.from_numpy(img_np.transpose(2, 0, 1).astype(np.float32) / 255.0).unsqueeze(0)
        if device == "cuda":
            img_t = img_t.cuda()

    # 5. Sepia — matrix transform on GPU
    if sepia > 0:
        sepia_kernel = torch.tensor([
            [0.131, 0.534, 0.272],
            [0.168, 0.686, 0.349],
            [0.189, 0.769, 0.393]
        ], device=img_t.device, dtype=torch.float32)  # BGR layout
        
        b, c, h, w = img_t.shape
        flat = img_t.squeeze(0).reshape(3, -1)  # [3, H*W]
        sepia_flat = sepia_kernel @ flat           # [3, H*W]
        sepia_t = sepia_flat.reshape(1, 3, h, w)
        alpha = sepia / 100.0
        img_t = img_t * (1 - alpha) + sepia_t * alpha

    # 6. Blur — GPU convolution
    if blur > 0:
        k = int(blur / 5) * 2 + 1
        k = max(3, k)
        # Simple box blur kernel
        blur_kernel = torch.ones(3, 1, k, k, device=img_t.device) / (k * k)
        img_t = F.conv2d(img_t, blur_kernel, padding=k//2, groups=3)

    # 7. Sharpness — Laplacian kernel on GPU
    if sharpness > 0:
        sharp_kernel = torch.tensor([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]], 
                                     device=img_t.device, dtype=torch.float32)
        sharp_kernel = sharp_kernel.unsqueeze(0).unsqueeze(0).repeat(3, 1, 1, 1)
        sharpened = F.conv2d(img_t, sharp_kernel, padding=1, groups=3)
        alpha = min(sharpness / 100.0, 1.0)
        img_t = img_t * (1 - alpha) + sharpened * alpha

    # 8. Bloom — GPU gaussian blur + screen blend
    if bloom > 0:
        k = int(bloom / 2) * 2 + 1
        k = max(3, k)
        bloom_kernel = torch.ones(3, 1, k, k, device=img_t.device) / (k * k)
        blurred = F.conv2d(img_t, bloom_kernel, padding=k//2, groups=3)
        bloom_strength = bloom / 100.0
        img_t = 1.0 - (1.0 - img_t) * (1.0 - blurred * bloom_strength)

    # 9. Vignette — radial mask on GPU
    if vignette > 0:
        b, c, h, w = img_t.shape
        factor = 1.0 - (vignette / 150.0)
        y_coords = torch.linspace(-1, 1, h, device=img_t.device)
        x_coords = torch.linspace(-1, 1, w, device=img_t.device)
        Y, X = torch.meshgrid(y_coords, x_coords, indexing='ij')
        dist = torch.sqrt(X**2 + Y**2)
        mask = 1.0 - torch.clamp((dist - factor) / (1.0 - factor + 1e-6), 0, 1)
        mask = mask.unsqueeze(0).unsqueeze(0)
        img_t = img_t * mask

    # 10. Grain — random noise on GPU
    if grain > 0:
        noise = torch.randn_like(img_t) * (grain / 255.0)
        img_t = img_t + noise

    # Clamp and convert back
    img_t = torch.clamp(img_t, 0, 1)
    img = (img_t.squeeze(0).cpu().numpy().transpose(1, 2, 0) * 255).astype(np.uint8)
    
    cv2.imwrite(str(out_path), img)
    return out_path

@router.post("/filter")
async def filter_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    brightness: float = Form(0),
    contrast: float = Form(0),
    saturation: float = Form(0),
    exposure: float = Form(0),
    highlights: float = Form(0),
    shadows: float = Form(0),
    temperature: float = Form(0),
    tint: float = Form(0),
    vibrance: float = Form(0),
    sharpness: float = Form(0),
    blur: float = Form(0),
    vignette: float = Form(0),
    grain: float = Form(0),
    sepia: float = Form(0),
    hue: float = Form(0),
    bloom: float = Form(0),
    clarity: float = Form(0)
) -> dict:
    params = {
        "brightness": brightness, "contrast": contrast, "saturation": saturation,
        "exposure": exposure, "highlights": highlights, "shadows": shadows,
        "temperature": temperature, "tint": tint, "vibrance": vibrance,
        "sharpness": sharpness, "blur": blur, "vignette": vignette,
        "grain": grain, "sepia": sepia, "hue": hue, "bloom": bloom, "clarity": clarity
    }
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="filter",
        processor=lambda p, **kwargs: process_filter(p, **params, **kwargs),
    )
