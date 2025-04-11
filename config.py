import os
import secrets
from pathlib import Path
from typing import Optional, List, Dict, Any
from pydantic import BaseSettings, validator, Field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Generate a random secret key if not provided
def generate_secret_key() -> str:
    return secrets.token_hex(32)

class Settings(BaseSettings):
    """Application settings.

    This class defines all the configuration settings for the application.
    Values are loaded from environment variables or .env file, with defaults provided.
    """
    # Base paths
    BASE_DIR: Path = Field(
        default_factory=lambda: Path.home() / "parachute_3d_project",
        description="Base directory for all project files"
    )
    FRAMES_DIR: Path = Field(
        default=None,
        description="Directory for extracted video frames"
    )
    VIDEO_SEGMENT: Path = Field(
        default=None,
        description="Path to the video segment file"
    )
    OUTPUT_DIR: Path = Field(
        default=None,
        description="Directory for Meshroom output files"
    )
    EXPORT_DIR: Path = Field(
        default_factory=lambda: Path.home() / "3d_exports",
        description="Directory for exported 3D models"
    )
    AUDIT_LOG: Path = Field(
        default=None,
        description="Path to the audit log file"
    )

    # External binaries
    MESHROOM_BIN: str = Field(
        default="/usr/local/bin/meshroom_batch",
        description="Path to the Meshroom batch processing binary"
    )

    # API settings
    API_HOST: str = Field(
        default="0.0.0.0",
        description="Host address for the API server"
    )
    API_PORT: int = Field(
        default=8000,
        description="Port for the API server"
    )
    API_WORKERS: int = Field(
        default=4,
        description="Number of worker processes for the API server"
    )
    DEBUG: bool = Field(
        default=False,
        description="Enable debug mode"
    )

    # Security
    SECRET_KEY: str = Field(
        default_factory=generate_secret_key,
        description="Secret key for JWT token encryption"
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="Algorithm for JWT token encryption"
    )
    ADMIN_USERNAME: str = Field(
        default="admin",
        description="Username for API authentication"
    )
    ADMIN_PASSWORD: str = Field(
        default="admin",
        description="Password for API authentication"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Expiration time for access tokens in minutes"
    )

    # Processing settings
    DEFAULT_FPS: int = Field(
        default=10,
        description="Default frames per second for frame extraction"
    )
    MAX_DURATION: int = Field(
        default=300,  # 5 minutes
        description="Maximum allowed duration for video segments in seconds"
    )
    SUPPORTED_EXPORT_FORMATS: List[str] = Field(
        default=[".obj", ".stl", ".glb", ".ply"],
        description="Supported 3D model export formats"
    )

    # Validators and computed fields
    @validator("FRAMES_DIR", "VIDEO_SEGMENT", "OUTPUT_DIR", "AUDIT_LOG", pre=True)
    def set_derived_paths(cls, v, values):
        """Set derived paths based on BASE_DIR if not explicitly provided."""
        if v is None and "BASE_DIR" in values:
            base_dir = values["BASE_DIR"]
            field_name = next(name for name, field in cls.__fields__.items() if field.default == v)

            if field_name == "FRAMES_DIR":
                return base_dir / "frames"
            elif field_name == "VIDEO_SEGMENT":
                return base_dir / "video_segment.mp4"
            elif field_name == "OUTPUT_DIR":
                return base_dir / "meshroom_output"
            elif field_name == "AUDIT_LOG":
                return base_dir / "audit.log"
        return v

    @validator("BASE_DIR", "FRAMES_DIR", "OUTPUT_DIR", "EXPORT_DIR")
    def create_directories(cls, v):
        """Ensure directories exist."""
        if v is not None:
            v.mkdir(parents=True, exist_ok=True)
        return v

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v):
        """Validate that the secret key is not the default in production."""
        if v == "your-secret-key-here" and not os.environ.get("DEBUG", "").lower() == "true":
            import warnings
            warnings.warn(
                "WARNING: Using default SECRET_KEY in production. "
                "This is a security risk. Please set a secure SECRET_KEY in your .env file."
            )
        return v

    @validator("ADMIN_USERNAME", "ADMIN_PASSWORD")
    def validate_admin_credentials(cls, v, values, field):
        """Validate that admin credentials are not the defaults in production."""
        if field.name == "ADMIN_PASSWORD" and v == "admin" and values.get("ADMIN_USERNAME") == "admin":
            if not os.environ.get("DEBUG", "").lower() == "true":
                import warnings
                warnings.warn(
                    "WARNING: Using default admin credentials in production. "
                    "This is a security risk. Please set secure credentials in your .env file."
                )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"

settings = Settings()
