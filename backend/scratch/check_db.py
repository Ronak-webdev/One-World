import sqlite3
from pathlib import Path

db_path = Path("temp/jobs.db")
if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    cursor = conn.execute("PRAGMA table_info(jobs)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns: {columns}")
    
    # Check a few jobs
    cursor = conn.execute("SELECT job_id, results FROM jobs LIMIT 5")
    for row in cursor.fetchall():
        print(f"Job: {row[0]}, Results: {row[1]}")
    conn.close()
else:
    print("DB not found")
