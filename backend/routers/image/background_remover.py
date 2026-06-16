import torch
from pathlib import Path
from PIL import Image, ImageFilter
from torchvision import transforms
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.config import settings
from core.file_handler import output_path
from core.job_queue import enqueue_upload_job
from core.gpu_utils import get_device, clear_vram, get_autocast_context

router = APIRouter()

# Global cache to prevent reloading the model on every request
_birefnet_model = None

def get_birefnet_model():
    global _birefnet_model
    if _birefnet_model is None:
        from transformers import AutoModelForImageSegmentation
        device = get_device()
        _birefnet_model = AutoModelForImageSegmentation.from_pretrained(
            "ZhengPeng7/BiRefNet", trust_remote_code=True
        ).to(device)
        # Use FP16 on GPU for ~2× faster inference
        if device == "cuda":
            _birefnet_model = _birefnet_model.half()
        _birefnet_model.eval()
        print(f"[BiRefNet] Loaded on {device} ({'FP16' if device == 'cuda' else 'FP32'})")
    return _birefnet_model

def process_remove_background(
    input_path: Path, 
    job_id: str,
    bg_color: str = "transparent", 
    output_format: str = "png", 
    hd_quality: str = "true", 
    edge_smooth: str = "true"
) -> Path:
    ext = f".{output_format}" if output_format in ["png", "webp", "jpg"] else ".png"
    # JPEG does not support transparency
    if ext == ".jpg" and bg_color == "transparent":
        bg_color = "white"
        
    out_path = output_path(job_id, ext)
    
    try:
        # Attempt Primary: BiRefNet
        device = get_device()
        model = get_birefnet_model()

        original_image = Image.open(input_path).convert("RGB")
        original_size = original_image.size
        
        # Downscale for faster processing if not HD
        if hd_quality == "false" and max(original_size) > 1024:
            original_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            original_size = original_image.size

        # Use FP16 tensors on CUDA to match model dtype
        tensor_dtype = torch.float16 if device == "cuda" else torch.float32
        transform = transforms.Compose([
            transforms.Resize((1024, 1024)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        input_tensor = transform(original_image).unsqueeze(0).to(device, dtype=tensor_dtype)

        with torch.inference_mode(), get_autocast_context(device):
            preds = model(input_tensor)[-1].sigmoid().cpu().float()

        pred = preds[0].squeeze()
        pred_pil = transforms.ToPILImage()(pred).resize(original_size, resample=Image.Resampling.LANCZOS)

        # Apply Edge Smoothing
        if edge_smooth == "true":
            pred_pil = pred_pil.filter(ImageFilter.GaussianBlur(radius=1.5))

        # Composite Result
        result_image = original_image.copy()
        result_image.putalpha(pred_pil)
        
        if bg_color != "transparent":
            if bg_color == "blur":
                bg_img = original_image.copy().filter(ImageFilter.GaussianBlur(radius=15))
            elif bg_color in ["white", "black"]:
                bg_img = Image.new("RGB", original_size, bg_color)
            else:
                bg_img = Image.new("RGB", original_size, "white")
                
            bg_img.paste(result_image, (0, 0), result_image)
            result_image = bg_img

        # Save
        save_kwargs = {}
        if ext == ".jpg":
            save_kwargs = {"quality": 95 if hd_quality == "true" else 80}
        elif ext == ".webp":
            save_kwargs = {"quality": 100 if hd_quality == "true" else 80, "lossless": hd_quality == "true"}

        result_image.save(out_path, format=output_format.upper() if output_format != "jpg" else "JPEG", **save_kwargs)

        clear_vram()
        return out_path
        
    except Exception as e:
        print(f"BiRefNet failed ({e}). Attempting fallback to rembg...")
        clear_vram()
        
        try:
            # Fallback: rembg (bare minimum functionality)
            from rembg import new_session, remove
            session = new_session(settings.rembg_model)
            fallback_img = Image.open(input_path)
            res = remove(fallback_img, session=session)
            if bg_color in ["white", "black"]:
                bg = Image.new("RGB", res.size, bg_color)
                bg.paste(res, (0, 0), res)
                res = bg
            res.save(out_path)
            return out_path
        except ImportError:
            raise RuntimeError("Primary AI (BiRefNet) failed and fallback (rembg) is not installed. Please run 'pip install rembg'.")
        except Exception as fe:
            raise RuntimeError(f"All background removal methods failed. Error: {fe}")

@router.post("/remove-background")
async def remove_background(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    bg_color: str = Form("transparent"),
    output_format: str = Form("png"),
    hd_quality: str = Form("true"),
    edge_smooth: str = Form("true")
) -> dict:
    def custom_processor(in_path: Path, **kwargs) -> Path:
        return process_remove_background(in_path, bg_color=bg_color, output_format=output_format, hd_quality=hd_quality, edge_smooth=edge_smooth, **kwargs)
        
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="remove-background",
        processor=custom_processor,
    )

