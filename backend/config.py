from __future__ import annotations

import os
from pathlib import Path
from types import SimpleNamespace

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "backend" / ".env")


MYSQL_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DB", "prescription_db"),
    "port": os.getenv("MYSQL_PORT", "3306"),
}

USE_MYSQL = os.getenv("USE_MYSQL", "false").strip().lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if USE_MYSQL:
    DATABASE_URL = (
        f"mysql+mysqlconnector://{MYSQL_CONFIG['user']}:{MYSQL_CONFIG['password']}"
        f"@{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}"
    )
else:
    DATABASE_URL = f"sqlite:///{BASE_DIR / 'prescription_checker.db'}"

settings = SimpleNamespace(
    DATABASE_URL=DATABASE_URL,
    GEMINI_API_KEY=GEMINI_API_KEY,
    MYSQL_CONFIG=MYSQL_CONFIG,
    USE_MYSQL=USE_MYSQL,
)
