import os
import shutil
import sys
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, UploadFile

from core.gpu_utils import check_vram_gb, get_device
from core.file_handler import output_path
from core.job_queue import enqueue_upload_job, get_job
from core.media import run_checked
from core.media import require_binary

router = APIRouter()


def process_vocal_remove(input_path: Path) -> Path:
    job_id = input_path.stem
    out_dir = output_path(job_id, ".dir")
    out_dir.mkdir(parents=True, exist_ok=True)
    model_dir = Path(os.getenv("AUDIO_SEPARATOR_MODEL_DIR", str(Path(__file__).resolve().parents[2] / "temp" / "models")))
    model_dir.mkdir(parents=True, exist_ok=True)

    # Run audio-separator via the active Python interpreter to keep dependency
    # resolution within the backend environment (avoids global PATH mismatches).
    cmd = [
        sys.executable,
        "-m",
        "audio_separator.utils.cli",
        str(input_path),
        "-m",
        "UVR-MDX-NET-Inst_HQ_3.onnx",
        "--output_dir",
        str(out_dir),
        "--model_file_dir",
        str(model_dir),
        "--use_autocast",
        "--log_level",
        "warning",
    ]

    if get_device() == "cuda":
        vram_gb = check_vram_gb()
        # Aggressive but bounded batch sizing for better throughput on larger GPUs.
        if vram_gb >= 16:
            batch_size = 4
        elif vram_gb >= 10:
            batch_size = 2
        else:
            batch_size = 1
        cmd.extend(["--mdxc_batch_size", str(batch_size)])

    env = os.environ.copy()
    env["AUDIO_SEPARATOR_MODEL_DIR"] = str(model_dir)

    # Pre-convert input to a guaranteed-valid WAV using ffmpeg (fixes malformed uploads)
    ffmpeg = require_binary("ffmpeg")
    tmp_wav = out_dir / (job_id + "_input.wav")
    try:
        run_checked([ffmpeg, "-y", "-i", str(input_path), "-ar", "44100", "-ac", "1", str(tmp_wav)])
        input_for_separator = tmp_wav

        # Ensure minimum duration for some separators: if shorter than 10s, repeat the audio until >=10s
        import subprocess, math

        probe = subprocess.run([
            ffmpeg,
            "-hide_banner",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(tmp_wav),
        ], capture_output=True, text=True)
        try:
            duration = float(probe.stdout.strip() or 0.0)
        except Exception:
            duration = 0.0

        original_duration = duration

        if duration > 0 and duration < 10.0:
            repeat_count = int(math.ceil(10.0 / duration))
            list_file = out_dir / (job_id + "_concat.txt")
            repeated = out_dir / (job_id + "_repeated.wav")
            # write concat list repeating the input path
            with open(list_file, "w", encoding="utf-8") as f:
                for _ in range(repeat_count):
                    f.write(f'file "{str(tmp_wav)}"\n')
            # Use ffmpeg concat demuxer to join repeated copies and re-encode
            run_checked([
                ffmpeg,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-ar",
                "44100",
                "-ac",
                "1",
                str(repeated),
            ])
            input_for_separator = repeated
    except Exception:
        # If ffmpeg conversion fails, fall back to original file
        input_for_separator = input_path

    # Try programmatic API first (more reliable in-process). Fall back to CLI subprocess.
    try:
        import logging
        from audio_separator.separator import Separator

        log_formatter = logging.Formatter(fmt="%(asctime)s.%(msecs)03d - %(levelname)s - %(module)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        separator = Separator(
            log_level=logging.WARNING,
            log_formatter=log_formatter,
            model_file_dir=str(model_dir),
            output_dir=str(out_dir),
            output_format="FLAC",
            use_autocast=True,
        )
        # Attach file handler so programmatic logs are preserved in the output folder
        fh = logging.FileHandler(str(out_dir / "audio-separator.program.log"))
        fh.setFormatter(log_formatter)
        # Remove existing handlers and add file handler to capture logs
        for h in list(separator.logger.handlers):
            separator.logger.removeHandler(h)
        separator.logger.addHandler(fh)

        # Ensure a model is loaded (will download if missing) before separating
        try:
            separator.load_model("UVR-MDX-NET-Inst_HQ_3.onnx")
        except Exception:
            separator.logger.exception("Model load failed")
            raise

        # Run separation on the (possibly repeated) input
        output_files = separator.separate([str(input_for_separator)])

        if not output_files:
            raise RuntimeError("audio-separator returned no output files when called programmatically")

    except Exception as exc:
        # Fallback to subprocess CLI if programmatic call fails; capture logs for diagnosis.
        import subprocess

        proc = subprocess.run(cmd, capture_output=True, text=True, env=env)
        (out_dir / "audio-separator.stdout.log").write_text(proc.stdout)
        (out_dir / "audio-separator.stderr.log").write_text(proc.stderr)

        if proc.returncode != 0:
            raise RuntimeError(f"audio-separator failed: {proc.stderr.strip() or proc.stdout.strip()}")

        # Verify output files exist (non-empty directory). If none, surface logs.
        files = [p for p in out_dir.rglob("*") if p.is_file()]
        if not files:
            stdout = (out_dir / "audio-separator.stdout.log").read_text()
            stderr = (out_dir / "audio-separator.stderr.log").read_text()
            raise RuntimeError(f"audio-separator produced no output files. stdout:\n{stdout}\nstderr:\n{stderr}")
    # If we repeated the input to meet minimum length, trim the produced stems back to the original duration
    try:
        if 'original_duration' in locals() and original_duration and original_duration < 10.0:
            for p in out_dir.rglob("*"):
                if p.suffix.lower() in (".wav", ".flac", ".mp3", ".m4a", ".ogg"):
                    trimmed = p.with_suffix(p.suffix + ".trim")
                    run_checked([
                        ffmpeg,
                        "-y",
                        "-i",
                        str(p),
                        "-t",
                        str(original_duration),
                        "-ar",
                        "44100",
                        "-ac",
                        "1",
                        str(trimmed),
                    ])
                    try:
                        trimmed.replace(p)
                    except Exception:
                        shutil.move(str(trimmed), str(p))
    except Exception:
        # If trimming fails, continue but keep the longer files; capture in logs
        (out_dir / "audio-separator.stderr.log").write_text((out_dir / "audio-separator.stderr.log").read_text() + "\nTrimming failed\n")

    # Organize and rename output files
    final_outputs = []
    job = get_job(job_id)
    orig_base = Path(job.original_filename).stem

    for p in out_dir.glob("*"):
        if p.is_file() and p.suffix.lower() in (".wav", ".flac", ".mp3", ".m4a", ".ogg"):
            new_name = p.name
            label = "Other"
            if "instrumental" in p.name.lower():
                new_name = f"{orig_base}_Instrumental{p.suffix}"
                label = "Instrumental"
            elif "vocal" in p.name.lower():
                new_name = f"{orig_base}_Vocal{p.suffix}"
                label = "Vocal"
            
            new_path = p.parent / new_name
            if p != new_path:
                p.rename(new_path)
            
            final_outputs.append({
                "name": new_name,
                "label": label,
                "path": str(new_path)
            })

    # Sort outputs: Vocal first, then Instrumental, then others
    label_order = {"Vocal": 0, "Instrumental": 1, "Other": 2}
    final_outputs.sort(key=lambda x: label_order.get(x["label"], 3))

    zip_base = output_path(job_id, ".zip").with_suffix("")
    zip_path = Path(shutil.make_archive(str(zip_base), "zip", out_dir))
    
    return {
        "zip": zip_path,
        "outputs": final_outputs
    }


@router.post("/vocal-remove")
async def vocal_remove(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> dict:
    return await enqueue_upload_job(
        background_tasks=background_tasks,
        file=file,
        toolkit="audio",
        operation="vocal-remove",
        processor=process_vocal_remove,
    )

