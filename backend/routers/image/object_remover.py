import tempfile
import aiofiles
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.file_handler import output_path
from core.job_queue import enqueue_upload_job

router = APIRouter()

# Global cache for LaMa to prevent reloading
_lama_model = None

def get_lama_model():
    global _lama_model
    if _lama_model is None:
        from simple_lama_inpainting import SimpleLama
        _lama_model = SimpleLama()
    return _lama_model

def process_object_remove(input_path: Path, job_id: str, mask_path: Optional[Path] = None) -> Path:
    try:
        from PIL import Image
        from core.gpu_utils import clear_vram
    except Exception as exc:
        raise NotImplementedError("Pillow and simple-lama-inpainting are required") from exc

    out_path = output_path(job_id, ".png")
    
    if mask_path is None or not mask_path.exists():
        # Fallback if no mask is provided (preserve contract)
        print("No mask provided for Object Removal. Returning original image.")
        with Image.open(input_path) as image:
            image.convert("RGB").save(out_path)
        return out_path

    # LaMa Inpainting
    try:
        model = get_lama_model()
        image = Image.open(input_path).convert("RGB")
        mask = Image.open(mask_path).convert("L")
        
        # Ensure mask matches image size
        if image.size != mask.size:
            mask = mask.resize(image.size, Image.Resampling.NEAREST)
            
        result = model(image, mask)
        result.save(out_path)
        
        clear_vram()
        return out_path
    except Exception as e:
        print(f"LaMa inpainting failed: {e}")
        clear_vram()
        # Fallback
        with Image.open(input_path) as image:
            image.convert("RGB").save(out_path)
        return out_path


@router.post("/remove-object")
async def remove_object(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    mask: Optional[UploadFile] = File(None)
) -> dict:
    
    mask_path = None
    if mask:
        # Save mask to a temporary file
        temp_dir = Path(tempfile.gettempdir())
        mask_path = temp_dir / f"mask_{file.filename}"
        async with aiofiles.open(mask_path, "wb") as out:
            while chunk := await mask.read(1024 * 1024):
                await out.write(chunk)

    # We use a custom processor wrapper to pass the mask path
    def custom_processor(in_path: Path, **kwargs) -> Path:
        return process_object_remove(in_path, mask_path=mask_path, **kwargs)

    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="remove-object",
        processor=custom_processor,
    )

