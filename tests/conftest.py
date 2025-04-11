import pytest
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_settings():
    """Create a mock settings object for testing"""
    mock = MagicMock()
    
    # Set up basic attributes
    mock.BASE_DIR = Path("/tmp/test_parachute_project")
    mock.FRAMES_DIR = mock.BASE_DIR / "frames"
    mock.VIDEO_SEGMENT = mock.BASE_DIR / "video_segment.mp4"
    mock.OUTPUT_DIR = mock.BASE_DIR / "meshroom_output"
    mock.EXPORT_DIR = Path("/tmp/test_exports")
    mock.AUDIT_LOG = mock.BASE_DIR / "audit.log"
    
    # API settings
    mock.API_HOST = "127.0.0.1"
    mock.API_PORT = 8000
    mock.API_WORKERS = 1
    mock.DEBUG = True
    
    # Security settings
    mock.SECRET_KEY = "test_secret_key"
    mock.ALGORITHM = "HS256"
    mock.ADMIN_USERNAME = "test_admin"
    mock.ADMIN_PASSWORD = "test_password"
    mock.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # Processing settings
    mock.DEFAULT_FPS = 10
    mock.MAX_DURATION = 10  # Short duration for tests
    mock.SUPPORTED_EXPORT_FORMATS = [".obj", ".stl", ".glb", ".ply"]
    
    # External binaries
    mock.MESHROOM_BIN = "/usr/local/bin/meshroom_batch"
    
    return mock

@pytest.fixture
def mock_subprocess_run():
    """Mock subprocess.run to avoid actual command execution"""
    with patch('subprocess.run') as mock_run:
        # Configure the mock to return a successful result
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "Test output"
        mock_process.stderr = ""
        mock_run.return_value = mock_process
        yield mock_run

@pytest.fixture
def mock_pipeline():
    """Mock the pipeline function"""
    with patch('core.pipeline') as mock:
        # Configure the mock to return a list of fake export paths
        mock.return_value = [
            Path("/tmp/test_exports/model.obj"),
            Path("/tmp/test_exports/model.glb")
        ]
        yield mock
