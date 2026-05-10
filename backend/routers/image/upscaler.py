from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.config import settings
from core.file_handler import output_path
from core.gpu_utils import get_device
from core.job_queue import enqueue_upload_job

router = APIRouter()


def process_upscale(input_path: Path) -> Path:
    if not settings.real_esrgan_model_path.exists():
        raise NotImplementedError(f"Real-ESRGAN weights not found at {settings.real_esrgan_model_path}")
    try:
        import cv2
        from basicsr.archs.rrdbnet_arch import RRDBNet
        from realesrgan import RealESRGANer
    except Exception as exc:
        raise NotImplementedError("basicsr, realesrgan, and opencv-python are required for upscaling") from exc

    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    upscaler = RealESRGANer(
        scale=4,
        model_path=str(settings.real_esrgan_model_path),
        model=model,
        tile=400,
        tile_pad=10,
        pre_pad=0,
        half=get_device() == "cuda",
    )
    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)
    output, _ = upscaler.enhance(img, outscale=4)
    out_path = output_path(input_path.stem, ".png")
    cv2.imwrite(str(out_path), output)
    return out_path


@router.post("/upscale")
async def upscale(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="image",
        operation="upscale",
        processor=process_upscale,
    )

