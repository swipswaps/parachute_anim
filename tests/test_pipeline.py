import pytest
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Import the modules we want to test
from config import settings
import api
from core import pipeline

def test_settings_loaded():
    """Test that settings are loaded correctly"""
    assert hasattr(settings, 'BASE_DIR')
    assert hasattr(settings, 'API_HOST')
    assert hasattr(settings, 'API_PORT')
    assert hasattr(settings, 'MESHROOM_BIN')

def test_api_initialization():
    """Test that the API initializes correctly"""
    assert hasattr(api, 'app')
    assert api.app.title == "Parachute 3D Pipeline API"

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test the health endpoint"""
    from fastapi.testclient import TestClient

    client = TestClient(api.app)
    response = client.get("/health")

    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_process_video_function():
    """Test the process_video background task function"""
    # Mock the pipeline function
    with patch('api.pipeline') as mock_pipeline:
        # Configure the mock
        mock_pipeline.return_value = [Path("/fake/path/model.obj")]

        # Call the function
        await api.process_video(
            Path("/fake/path/video.mp4"),
            "https://example.com/video",
            "00:00:10",
            5
        )

        # Verify the mock was called with the expected arguments
        mock_pipeline.assert_called_once_with(
            url="https://example.com/video",
            start="00:00:10",
            duration=5
        )