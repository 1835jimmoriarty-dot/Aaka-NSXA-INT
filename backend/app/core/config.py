import os
import shutil
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AAKA-NSXA Intelligence — Network Security Analytics & Intelligence Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aaka_nsxa.db")
    
    # Tool configurations
    NMAP_PATH: str = os.getenv("NMAP_PATH", r"D:\Nmap\nmap.exe" if os.path.exists(r"D:\Nmap\nmap.exe") else (shutil.which("nmap") or "nmap"))
    WHATWEB_PATH: str = os.getenv("WHATWEB_PATH", shutil.which("whatweb") or "")
    NIKTO_PATH: str = os.getenv("NIKTO_PATH", shutil.which("nikto") or "")
    CURL_PATH: str = os.getenv("CURL_PATH", shutil.which("curl") or r"C:\Windows\System32\curl.exe")
    
    # Execution constraints
    MAX_CONCURRENT_JOBS: int = 3
    DEFAULT_SCAN_TIMEOUT: int = 1800  # seconds
    MAX_TARGETS_PER_SCAN: int = 256
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    LOG_LEVEL: str = "INFO"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
