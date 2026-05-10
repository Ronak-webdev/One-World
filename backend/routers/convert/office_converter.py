import subprocess
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.config import settings
from core.job_queue import enqueue_upload_job
from core.media import require_binary

router = APIRouter()


def libreoffice_convert(input_path: Path, output_format: str) -> Path:
    soffice = require_binary("soffice")
    proc = subprocess.run(
        [soffice, "--headless", "--convert-to", output_format, "--outdir", str(settings.output_dir), str(input_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "LibreOffice conversion failed")
    out_path = settings.output_dir / f"{input_path.stem}.{output_format}"
    if not out_path.exists():
        raise RuntimeError("LibreOffice did not produce an output file")
    return out_path


@router.post("/word-to-pdf")
async def word_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(background_tasks=background_tasks, file=file, toolkit="convert", operation="word-to-pdf", processor=lambda path: libreoffice_convert(path, "pdf"))


@router.post("/ppt-to-pdf")
async def ppt_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(background_tasks=background_tasks, file=file, toolkit="convert", operation="ppt-to-pdf", processor=lambda path: libreoffice_convert(path, "pdf"))


@router.post("/excel-to-pdf")
async def excel_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(background_tasks=background_tasks, file=file, toolkit="convert", operation="excel-to-pdf", processor=lambda path: libreoffice_convert(path, "pdf"))


@router.post("/odt-to-pdf")
async def odt_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(background_tasks=background_tasks, file=file, toolkit="convert", operation="odt-to-pdf", processor=lambda path: libreoffice_convert(path, "pdf"))

