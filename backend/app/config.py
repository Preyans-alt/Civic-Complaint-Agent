import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE_DEFAULT = str(BASE_DIR / "data" / "amc.json")

class Config:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    CORS_ORIGINS: list = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if o.strip()]
    DATA_FILE: str = os.getenv("DATA_FILE", DATA_FILE_DEFAULT)
    DEMO_ADMIN_TOKEN: str = os.getenv("DEMO_ADMIN_TOKEN", "civicflow-demo-admin-secret")
    TIMEZONE: str = "Asia/Kolkata"

config = Config()
