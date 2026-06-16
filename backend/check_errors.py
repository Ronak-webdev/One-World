import sqlite3
from pathlib import Path
import json

db_path = Path("backend/temp/jobs.db")
if not db_path.exists():
    print("DB not found")
else:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM jobs WHERE status='failed' ORDER BY rowid DESC LIMIT 1").fetchone()
    if row:
        print(f"Job ID: {row['job_id']}")
        print(f"Tool: {row['tool']}")
        print(f"Error: {row['error']}")
    else:
        print("No failed jobs found")
    conn.close()
