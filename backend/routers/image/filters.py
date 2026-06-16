from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile
import numpy as np
import cv2

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()

def apply_vignette(img, amount: int):
    if amount <= 0: return img
    rows, cols = img.shape[:2]
    factor = 1.0 - (amount / 150.0)
    X_resultant_kernel = cv2.getGaussianKernel(cols, cols * factor)
    Y_resultant_kernel = cv2.getGaussianKernel(rows, rows * factor)
    kernel = Y_resultant_kernel * X_resultant_kernel.T
    mask = kernel / kernel.max()
    img_v = img.astype(np.float32)
    for i in range(3):
        img_v[:,:,i] *= mask
    return np.clip(img_v, 0, 255).astype(np.uint8)

def apply_grain(img, amount: int):
    if amount <= 0: return img
    noise = np.random.normal(0, amount, img.shape).astype(np.float32)
    img_n = img.astype(np.float32) + noise
    return np.clip(img_n, 0, 255).astype(np.uint8)

def apply_bloom(img, amount: int):
    if amount <= 0: return img
    blur_size = int(amount / 2) * 2 + 1
    blurred = cv2.GaussianBlur(img, (blur_size, blur_size), 0)
    # Screen blend: 1 - (1-a)*(1-b)
    img_f = img.astype(np.float32) / 255.0
    blur_f = blurred.astype(np.float32) / 255.0
    bloom = 1.0 - (1.0 - img_f) * (1.0 - blur_f * (amount / 100.0))
    return (bloom * 255).astype(np.uint8)

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
    out_path = output_path(job_id, ".png")
    img = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if img is None: raise ValueError("Invalid image")

    # 1. Exposure & Brightness
    # Map [-100, 100] to alpha/beta
    exp_factor = 1.0 + (exposure / 100.0)
    bright_offset = brightness * 2
    img = cv2.convertScaleAbs(img, alpha=exp_factor, beta=bright_offset)

    # 2. Contrast & Clarity
    cont_factor = 1.0 + ((contrast + clarity * 0.5) / 100.0)
    img = cv2.convertScaleAbs(img, alpha=cont_factor, beta=0)

    # 2.5 Highlights & Shadows (Selective adjustment)
    if highlights != 0 or shadows != 0:
        img_f = img.astype(np.float32)
        # Calculate luminosity (simple average or Y from YUV)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        
        # Highlights mask (smooth step targeting high values)
        h_mask = np.clip((gray - 0.5) * 2, 0, 1)
        # Shadows mask (smooth step targeting low values)
        s_mask = np.clip((0.5 - gray) * 2, 0, 1)
        
        # Apply adjustments
        # Highlights: Map [-100, 100] to gain
        h_gain = highlights / 200.0
        # Shadows: Map [-100, 100] to gain
        s_gain = shadows / 200.0
        
        for i in range(3):
            img_f[:,:,i] += img_f[:,:,i] * h_mask * h_gain
            img_f[:,:,i] += img_f[:,:,i] * s_mask * s_gain
            
        img = np.clip(img_f, 0, 255).astype(np.uint8)

    # 3. Color: Temperature & Tint
    if temperature != 0 or tint != 0:
        b, g, r = cv2.split(img.astype(np.float32))
        # Warmth: Add Red, Sub Blue
        r += temperature * 0.5
        b -= temperature * 0.5
        # Tint: Add Green/Magenta
        g += tint * 0.5
        img = cv2.merge([np.clip(b, 0, 255), np.clip(g, 0, 255), np.clip(r, 0, 255)]).astype(np.uint8)

    # 4. Saturation, Vibrance & Hue
    if saturation != 0 or vibrance != 0 or hue != 0:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:,:,0] = (hsv[:,:,0] + hue/2) % 180
        sat_mult = 1.0 + (saturation + vibrance * 0.5) / 100.0
        hsv[:,:,1] = np.clip(hsv[:,:,1] * sat_mult, 0, 255)
        img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    # 5. Sepia
    if sepia > 0:
        kernel = np.array([[0.272, 0.534, 0.131],
                           [0.349, 0.686, 0.168],
                           [0.393, 0.769, 0.189]])
        sepia_img = cv2.transform(img, kernel)
        alpha = sepia / 100.0
        img = cv2.addWeighted(sepia_img, alpha, img, 1 - alpha, 0)

    # 6. Effects: Blur, Sharpness, Bloom, Vignette, Grain
    if blur > 0:
        k = int(blur / 5) * 2 + 1
        img = cv2.GaussianBlur(img, (k, k), 0)
    
    if sharpness > 0:
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        img = cv2.filter2D(img, -1, kernel)
        
    if bloom > 0:
        img = apply_bloom(img, int(bloom))
        
    if vignette > 0:
        img = apply_vignette(img, int(vignette))
        
    if grain > 0:
        img = apply_grain(img, int(grain))

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
