import sys
from pathlib import Path
import asyncio

# Mocking the environment
sys.path.append(".")
from core.config import settings

def test():
    from routers.audio.vocal_remover import process_vocal_separation
    
    # We need a dummy file
    input_path = Path("temp/test_audio.wav")
    if not input_path.exists():
        # Create a dummy wave file
        import wave
        with wave.open(str(input_path), 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(44100)
            wf.writeframes(b'\x00' * 88200) # 1 second of silence
            
    print("Starting vocal separation...")
    try:
        result = process_vocal_separation(input_path, "test_job")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
