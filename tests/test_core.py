import pytest
import os
from pathlib import Path
from unittest.mock import patch, MagicMock

from core import (
    check_command_exists,
    check_dependencies,
    ensure_directories,
    PipelineError,
    VideoDownloadError,
    FrameExtractionError,
    MeshroomError
)
from config import settings

def test_check_command_exists():
    # Test with a command that should exist
    assert check_command_exists('python') == True
    # Test with a command that shouldn't exist
    assert check_command_exists('nonexistentcommand123456789') == False

def test_check_dependencies():
    # Mock the check_command_exists function
    with patch('core.check_command_exists') as mock_check:
        # Configure the mock to return True for all dependencies
        mock_check.return_value = True
        # Call the function
        result = check_dependencies()
        # Check the result
        assert result == {'ffmpeg': True, 'yt-dlp': True, 'meshroom': True}
        # Verify the mock was called with the expected arguments
        mock_check.assert_any_call('ffmpeg')
        mock_check.assert_any_call('yt-dlp')
        mock_check.assert_any_call(settings.MESHROOM_BIN)

@pytest.fixture
def temp_test_dirs(tmp_path):
    # Create a temporary directory structure for testing
    base_dir = tmp_path / "test_parachute_project"
    frames_dir = base_dir / "frames"
    video_segment = base_dir / "video_segment.mp4"
    output_dir = base_dir / "meshroom_output"
    export_dir = tmp_path / "test_exports"
    audit_log = base_dir / "audit.log"

    # Patch settings to use our test directories
    with patch('core.settings') as mock_settings:
        mock_settings.BASE_DIR = base_dir
        mock_settings.FRAMES_DIR = frames_dir
        mock_settings.VIDEO_SEGMENT = video_segment
        mock_settings.OUTPUT_DIR = output_dir
        mock_settings.EXPORT_DIR = export_dir
        mock_settings.AUDIT_LOG = audit_log
        yield mock_settings

def test_ensure_directories(temp_test_dirs):
    # Call the function with our mocked settings
    with patch('core.settings', temp_test_dirs):
        ensure_directories()

    # Check that directories were created
    assert temp_test_dirs.BASE_DIR.exists()
    assert temp_test_dirs.FRAMES_DIR.exists()
    assert temp_test_dirs.OUTPUT_DIR.exists()
    assert temp_test_dirs.EXPORT_DIR.exists()