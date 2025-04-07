import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from core import (
    pipeline,
    PipelineError,
    VideoDownloadError,
    FrameExtractionError,
    MeshroomError
)

@pytest.fixture
def mock_run_command():
    with patch("core.run_command") as mock:
        yield mock

@pytest.fixture
def mock_paths():
    with patch("core.settings") as mock_settings:
        mock_settings.BASE_DIR = Path("/tmp/test_base")
        mock_settings.FRAMES_DIR = Path("/tmp/test_frames")
        mock_settings.VIDEO_SEGMENT = Path("/tmp/test_video.mp4")
        mock_settings.OUTPUT_DIR = Path("/tmp/test_output")
        mock_settings.EXPORT_DIR = Path("/tmp/test_exports")
        mock_settings.AUDIT_LOG = Path("/tmp/test_audit.log")
        mock_settings.MESHROOM_BIN = "/usr/local/bin/meshroom_batch"
        mock_settings.DEFAULT_FPS = 10
        mock_settings.MAX_DURATION = 300
        mock_settings.SUPPORTED_EXPORT_FORMATS = [".obj", ".stl", ".glb", ".ply"]
        yield mock_settings

def test_pipeline_success(mock_run_command, mock_paths):
    """Test successful pipeline execution."""
    mock_run_command.return_value = MagicMock(returncode=0)
    
    result = pipeline(
        url="https://www.youtube.com/watch?v=test",
        start="00:00:00",
        duration=5
    )
    
    assert isinstance(result, list)
    mock_run_command.assert_called()

def test_pipeline_video_download_error(mock_run_command, mock_paths):
    """Test pipeline with video download error."""
    mock_run_command.side_effect = subprocess.CalledProcessError(1, "yt-dlp")
    
    with pytest.raises(VideoDownloadError):
        pipeline(
            url="https://www.youtube.com/watch?v=test",
            start="00:00:00",
            duration=5
        )

def test_pipeline_frame_extraction_error(mock_run_command, mock_paths):
    """Test pipeline with frame extraction error."""
    mock_run_command.side_effect = [
        MagicMock(returncode=0),  # First call succeeds (yt-dlp)
        subprocess.CalledProcessError(1, "ffmpeg")  # Second call fails
    ]
    
    with pytest.raises(FrameExtractionError):
        pipeline(
            url="https://www.youtube.com/watch?v=test",
            start="00:00:00",
            duration=5
        )

def test_pipeline_meshroom_error(mock_run_command, mock_paths):
    """Test pipeline with Meshroom error."""
    mock_run_command.side_effect = [
        MagicMock(returncode=0),  # yt-dlp succeeds
        MagicMock(returncode=0),  # ffmpeg succeeds
        subprocess.CalledProcessError(1, "meshroom")  # meshroom fails
    ]
    
    with pytest.raises(MeshroomError):
        pipeline(
            url="https://www.youtube.com/watch?v=test",
            start="00:00:00",
            duration=5
        )

def test_pipeline_invalid_duration(mock_run_command, mock_paths):
    """Test pipeline with invalid duration."""
    with pytest.raises(ValueError):
        pipeline(
            url="https://www.youtube.com/watch?v=test",
            start="00:00:00",
            duration=301  # Exceeds MAX_DURATION
        ) 