import pytest
import os
import sys
from parachute_3d_pipeline import ParachutePipeline

def test_pipeline_initialization():
    """Test that the pipeline initializes correctly"""
    pipeline = ParachutePipeline()
    assert pipeline is not None

def test_environment_variables():
    """Test that required environment variables are set"""
    from config import settings
    assert settings.OPENFOAM_DIR is not None
    assert os.path.exists(settings.OPENFOAM_DIR)