from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile

from core.file_handler import output_path, save_upload
from core.job_queue import create_job, run_job

router = APIRouter()

FILTERS = {
    "mono": "High-contrast monochrome",
    "cinema": "Soft cinematic contrast",
    "cool": "Cool temperature",
    "warm": "Warm temperature",
    "cartoon": "Bilateral smoothing with edge emphasis",
}


def process_filter(input_path: Path, filter_name: str, job_id: str) -> Path:
    try:
        from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    except Exception as exc:
        raise NotImplementedError("Pillow is required for filter processing") from exc

    name = filter_name if filter_name in FILTERS else "cinema"
    out_path = output_path(job_id, ".png")
    with Image.open(input_path) as image:
        img = image.convert("RGB")
        if name == "mono":
            img = ImageOps.grayscale(img).convert("RGB")
            img = ImageEnhance.Contrast(img).enhance(1.35)
        elif name == "cool":
            r, g, b = img.split()
            img = Image.merge("RGB", (r.point(lambda p: p * 0.94), g, b.point(lambda p: min(255, p * 1.08))))
        elif name == "warm":
            r, g, b = img.split()
            img = Image.merge("RGB", (r.point(lambda p: min(255, p * 1.08)), g, b.point(lambda p: p * 0.94)))
        elif name == "cartoon":
            img = img.filter(ImageFilter.SMOOTH_MORE).filter(ImageFilter.EDGE_ENHANCE_MORE)
        else:
            img = ImageEnhance.Color(img).enhance(1.08)
            img = ImageEnhance.Contrast(img).enhance(1.12)
        img.save(out_path)
    return out_path


@router.get("/filters/list")
async def list_filters() -> dict:
    return {"filters": [{"id": key, "label": value} for key, value in FILTERS.items()]}


@router.post("/apply-filter")
async def filter(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    filter_type: str = Form("grayscale"),
) -> dict:
    job_id, input_path, original_filename = await save_upload(file)
    create_job("image", "filter", job_id, original_filename)
    background_tasks.add_task(run_job, job_id, lambda path: process_filter(path, filter_type, job_id), input_path)
    return {"job_id": job_id, "status": "queued"}
