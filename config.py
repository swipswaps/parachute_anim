from pathlib import Path
from typing import Optional
from pydantic import BaseSettings, validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path.home() / "parachute_3d_project"
    FRAMES_DIR: Path = BASE_DIR / "frames"
    VIDEO_SEGMENT: Path = BASE_DIR / "video_segment.mp4"
    OUTPUT_DIR: Path = BASE_DIR / "meshroom_output"
    EXPORT_DIR: Path = Path.home() / "3d_exports"
    AUDIT_LOG: Path = BASE_DIR / "audit.log"
    
    # External binaries
    MESHROOM_BIN: str = "/usr/local/bin/meshroom_batch"
    
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Processing settings
    DEFAULT_FPS: int = 10
    MAX_DURATION: int = 300  # 5 minutes
    SUPPORTED_EXPORT_FORMATS: list = [".obj", ".stl", ".glb", ".ply"]
    
    @validator("BASE_DIR", "FRAMES_DIR", "VIDEO_SEGMENT", "OUTPUT_DIR", "EXPORT_DIR", "AUDIT_LOG")
    def create_directories(cls, v):
        v.mkdir(parents=True, exist_ok=True)
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()