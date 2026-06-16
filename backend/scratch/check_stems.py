import sqlite3
from pathlib import Path

db_path = Path("temp/jobs.db")
if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    cursor = conn.execute("SELECT job_id, tool, results FROM jobs WHERE tool='stem-separate' ORDER BY job_id DESC LIMIT 5")
    for row in cursor.fetchall():
        print(f"Job: {row[0]}, Tool: {row[1]}, Results: {row[2]}")
    conn.close()
