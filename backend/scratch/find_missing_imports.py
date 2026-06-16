import os
from pathlib import Path

def check_files():
    base_dir = Path(".")
    targets = list(base_dir.glob("routers/audio/*.py")) + list(base_dir.glob("core/*.py"))
    
    for p in targets:
        content = p.read_text(encoding="utf-8")
        if "settings" in content and "from core.config import settings" not in content:
            # Check if it's imported in some other way or just used
            print(f"Potential issue in {p}")

if __name__ == "__main__":
    check_files()
