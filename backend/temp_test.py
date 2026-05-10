from pathlib import Path
import wave, struct

# prepare paths
root = Path(__file__).parent.resolve()
uploads = root / 'temp' / 'uploads'
uploads.mkdir(parents=True, exist_ok=True)
fn = uploads / 'test_tone.wav'
# create 2s sine wave audio (non-zero) to validate separator
import math
duration = 2.0
sr = 44100
freq = 440.0
num = int(duration * sr)
with wave.open(str(fn),'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    frames = bytearray()
    for i in range(num):
        val = int(32767 * 0.5 * math.sin(2 * math.pi * freq * i / sr))
        frames += struct.pack('<h', val)
    wf.writeframes(bytes(frames))
print('wrote', fn)

from routers.audio.vocal_remover import process_vocal_remove
try:
    out = process_vocal_remove(fn)
    print('process returned', out)
except Exception as e:
    print('process raised', repr(e))
    # dump any logs in the expected out dir
    job_id = fn.stem
    out_dir = root / 'temp' / 'outputs' / (job_id + '.dir')
    print('expected out dir', out_dir)
    if out_dir.exists():
        for p in sorted(out_dir.rglob('*')):
            print('OUT:', p, 'is_file', p.is_file())
            if p.is_file():
                print('--- FILE', p.name, 'size', p.stat().st_size)
                try:
                    print(p.read_text()[:1000])
                except Exception:
                    pass
    else:
        print('out dir not present')
