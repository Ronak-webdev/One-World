import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.job_queue import run_job
from routers.audio.audio_enhancer import process_enhance

async def test():
    job_id = "test_manual_job"
    # Find a wav file in uploads
    uploads = Path("backend/temp/uploads").glob("*.wav")
    try:
        input_path = next(uploads)
        print(f"Testing with file: {input_path}")
        await run_job(job_id, process_enhance, input_path, job_id=job_id)
    except StopIteration:
        print("No wav files found in uploads to test with.")
    except Exception as e:
        print(f"Error during manual job: {e}")

if __name__ == "__main__":
    asyncio.run(test())
