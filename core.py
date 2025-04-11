# /usr/local/lib/parachute/core.py
import subprocess
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import settings

# Configure logging
logger.remove()
logger.add(
    settings.AUDIT_LOG,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="INFO",
    rotation="1 day",
    retention="7 days"
)
logger.add(sys.stderr, level="INFO" if not settings.DEBUG else "DEBUG")

class PipelineError(Exception):
    """Base exception for pipeline errors."""
    pass

class VideoDownloadError(PipelineError):
    """Raised when video download fails."""
    pass

class FrameExtractionError(PipelineError):
    """Raised when frame extraction fails."""
    pass

class MeshroomError(PipelineError):
    """Raised when Meshroom processing fails."""
    pass

class DependencyError(PipelineError):
    """Raised when dependency installation or verification fails."""
    pass

class FileSystemError(PipelineError):
    """Raised when file system operations fail."""
    pass
def check_command_exists(command: str) -> bool:
    """Check if a command exists in the system PATH."""
    return shutil.which(command) is not None

def check_dependencies() -> Dict[str, bool]:
    """Check if all required dependencies are installed."""
    dependencies = {
        "ffmpeg": check_command_exists("ffmpeg"),
        "yt-dlp": check_command_exists("yt-dlp"),
        "meshroom": check_command_exists(settings.MESHROOM_BIN)
    }
    return dependencies

def ensure_directories() -> None:
    """Ensure all required directories exist and are writable."""
    try:
        for directory in [
            settings.BASE_DIR,
            settings.FRAMES_DIR,
            settings.VIDEO_SEGMENT.parent,
            settings.OUTPUT_DIR,
            settings.EXPORT_DIR
        ]:
            directory.mkdir(parents=True, exist_ok=True)
            # Test if directory is writable
            test_file = directory / ".write_test"
            test_file.touch()
            test_file.unlink()
    except Exception as e:
        logger.error(f"Directory creation or permission error: {e}")
        raise FileSystemError(f"Failed to create or access directories: {e}")
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(subprocess.SubprocessError)
)
def run_command(command: List[str], shell: bool = False, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run a subprocess command with logging and error detection."""
    logger.info(f"Executing command: {' '.join(command)}")
    try:
        result = subprocess.run(
            command,
            shell=shell,
            capture_output=True,
            text=True,
            cwd=cwd,
            check=False  # We'll handle the error ourselves
        )
        if result.returncode != 0:
            logger.error(f"Command failed: {result.stderr}")
            raise subprocess.CalledProcessError(result.returncode, command, result.stdout, result.stderr)
        return result
    except subprocess.SubprocessError as e:
        logger.error(f"Subprocess error: {str(e)}")
        raise
def install_dependencies() -> None:
    """Install required packages using apt and pip."""
    try:
        # Check if we need to install dependencies
        dependencies = check_dependencies()
        if all(dependencies.values()):
            logger.info("All dependencies are already installed")
            return

        # Install system dependencies if needed
        if not dependencies["ffmpeg"]:
            logger.info("Installing ffmpeg...")
            run_command(["sudo", "apt-get", "update"])
            run_command(["sudo", "apt-get", "install", "-y", "ffmpeg"])

        # Install Python dependencies if needed
        if not dependencies["yt-dlp"]:
            logger.info("Installing yt-dlp...")
            run_command([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"])

        # Verify Meshroom installation
        if not dependencies["meshroom"]:
            logger.error("Meshroom is not installed or not in PATH")
            raise DependencyError("Meshroom is not installed or not in PATH. Please install it manually.")

        logger.info("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        raise DependencyError(f"Dependency installation failed: {e}")
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((subprocess.CalledProcessError, VideoDownloadError))
)
def download_segment(url: str, start: str, duration: int) -> None:
    """Download a segment from a YouTube video using yt-dlp and ffmpeg.

    Args:
        url: URL of the YouTube video
        start: Start time in format HH:MM:SS
        duration: Duration in seconds

    Raises:
        ValueError: If duration exceeds maximum allowed time or start time format is invalid
        VideoDownloadError: If video download or segment extraction fails
    """
    # Validate inputs
    if duration > settings.MAX_DURATION:
        raise ValueError(f"Duration exceeds maximum allowed time of {settings.MAX_DURATION} seconds")

    # Validate start time format (HH:MM:SS)
    import re
    if not re.match(r'^\d{2}:\d{2}:\d{2}$', start):
        raise ValueError(f"Start time must be in format HH:MM:SS, got: {start}")

    logger.info(f"Downloading video segment from {url} (start: {start}, duration: {duration}s)")
    try:
        # Ensure directories exist
        ensure_directories()

        # Create a unique temp file name to avoid conflicts in concurrent runs
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_file = settings.BASE_DIR / f"temp_download_{timestamp}.mp4"

        try:
            # First try with yt-dlp (more modern and usually faster)
            logger.debug(f"Attempting download with yt-dlp from {url}")
            run_command(["yt-dlp", "-f", "mp4", "-o", str(temp_file), url])
        except subprocess.CalledProcessError:
            # Fallback to youtube-dl if yt-dlp fails
            logger.warning("yt-dlp failed, trying youtube-dl as fallback")
            try:
                run_command(["youtube-dl", "-f", "mp4", "-o", str(temp_file), url])
            except subprocess.CalledProcessError as e:
                raise VideoDownloadError(f"Both yt-dlp and youtube-dl failed: {e}")

        # Extract segment
        logger.debug(f"Extracting segment from {start} for {duration}s")
        run_command([
            "ffmpeg", "-y", "-ss", start, "-i", str(temp_file),
            "-t", str(duration), "-c:v", "copy", "-c:a", "copy", str(settings.VIDEO_SEGMENT)
        ])

        # Clean up
        logger.debug(f"Cleaning up temporary file: {temp_file}")
        temp_file.unlink(missing_ok=True)
        logger.info("Video segment downloaded successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to download video segment: {e}")
        raise VideoDownloadError(f"Video download failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during video download: {e}")
        raise VideoDownloadError(f"Unexpected error during video download: {e}")

def extract_frames(fps: int = settings.DEFAULT_FPS) -> int:
    """Extract frames from the video segment using ffmpeg.

    Args:
        fps: Frames per second to extract (default: from settings)

    Returns:
        int: Number of frames extracted

    Raises:
        FileNotFoundError: If video segment file doesn't exist
        FrameExtractionError: If frame extraction fails or no frames are extracted
    """
    logger.info(f"Extracting frames at {fps} FPS")
    try:
        # Ensure video file exists
        if not settings.VIDEO_SEGMENT.exists():
            raise FileNotFoundError(f"Video file not found: {settings.VIDEO_SEGMENT}")

        # Ensure frames directory exists and is empty
        ensure_directories()

        # Clear any existing frames
        for existing_frame in settings.FRAMES_DIR.glob("*.jpg"):
            existing_frame.unlink()

        logger.debug(f"Extracting frames from {settings.VIDEO_SEGMENT} at {fps} FPS")

        # Extract frames with higher quality settings
        run_command([
            "ffmpeg", "-i", str(settings.VIDEO_SEGMENT),
            "-vf", f"fps={fps}",
            "-q:v", "2",  # Higher quality (lower means better quality, range 1-31)
            str(settings.FRAMES_DIR / "frame_%04d.jpg")
        ])

        # Verify frames were extracted
        frame_count = len(list(settings.FRAMES_DIR.glob("*.jpg")))
        if frame_count == 0:
            raise FrameExtractionError("No frames were extracted")

        logger.info(f"Frames extracted successfully: {frame_count} frames")
        return frame_count
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to extract frames: {e}")
        raise FrameExtractionError(f"Frame extraction failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during frame extraction: {e}")
        raise FrameExtractionError(f"Unexpected error during frame extraction: {e}")

def run_meshroom() -> bool:
    """Run Meshroom photogrammetry pipeline.

    Returns:
        bool: True if Meshroom processing was successful

    Raises:
        MeshroomError: If Meshroom is not installed, not enough frames are available,
                      or if the Meshroom processing fails
    """
    logger.info("Running Meshroom pipeline")
    try:
        # Ensure directories exist
        ensure_directories()

        # Check if Meshroom is installed
        if not check_command_exists(settings.MESHROOM_BIN):
            raise MeshroomError(f"Meshroom not found at {settings.MESHROOM_BIN}")

        # Check if we have frames to process
        frame_count = len(list(settings.FRAMES_DIR.glob("*.jpg")))
        if frame_count < 10:  # Meshroom typically needs at least 10 frames
            raise MeshroomError(f"Not enough frames for Meshroom processing: {frame_count} frames found")

        logger.debug(f"Starting Meshroom with {frame_count} frames")

        # Clear output directory to prevent mixing with previous runs
        if settings.OUTPUT_DIR.exists():
            for item in settings.OUTPUT_DIR.glob("*"):
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    import shutil
                    shutil.rmtree(item)

        # Run Meshroom with additional parameters for better quality
        run_command([
            settings.MESHROOM_BIN,
            "--input", str(settings.FRAMES_DIR),
            "--output", str(settings.OUTPUT_DIR),
            "--cache", str(settings.OUTPUT_DIR / "cache"),
            "--save", str(settings.OUTPUT_DIR / "project.mg")
        ])

        logger.info("Meshroom pipeline completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Meshroom pipeline failed: {e}")
        raise MeshroomError(f"Meshroom processing failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during Meshroom processing: {e}")
        raise MeshroomError(f"Unexpected error during Meshroom processing: {e}")

def collect_exports() -> List[Path]:
    """Find and log all exportable 3D files.

    Returns:
        List[Path]: List of paths to exported 3D model files

    Raises:
        PipelineError: If export collection fails
    """
    logger.info("Collecting export files")
    exported = []
    try:
        # Ensure directories exist
        ensure_directories()

        # Check if we have any output files
        if not settings.OUTPUT_DIR.exists() or not any(settings.OUTPUT_DIR.iterdir()):
            logger.warning("No output files found from Meshroom processing")
            return []

        # Create a timestamp for unique filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Collect exports
        for ext in settings.SUPPORTED_EXPORT_FORMATS:
            for file in settings.OUTPUT_DIR.rglob(f"*{ext}"):
                # Create a unique filename with timestamp to prevent overwriting
                unique_name = f"{file.stem}_{timestamp}{file.suffix}"
                destination = settings.EXPORT_DIR / unique_name

                # Copy the file with progress logging for large files
                file_size = file.stat().st_size
                logger.debug(f"Copying {file.name} ({file_size/1024/1024:.2f} MB) to {destination}")

                # Use shutil.copy2 to preserve metadata
                import shutil
                shutil.copy2(file, destination)

                logger.info(f"Exported {file.name} to {destination}")
                exported.append(destination)

        if not exported:
            logger.warning("No exportable files found")

        return exported
    except Exception as e:
        logger.error(f"Failed to collect exports: {e}")
        raise PipelineError(f"Export collection failed: {e}")
def pipeline(url: str, start: str, duration: int) -> List[Path]:
    """Execute the full 3D processing pipeline.

    This function orchestrates the entire process from video download to 3D model export.

    Args:
        url: URL of the YouTube video
        start: Start time in format HH:MM:SS
        duration: Duration in seconds

    Returns:
        List[Path]: List of paths to exported 3D model files

    Raises:
        Various exceptions from the individual pipeline steps
    """
    start_time = datetime.now()
    logger.info(f"Starting 3D processing pipeline for video: {url}")
    try:
        # Initial setup
        logger.debug("Setting up directories")
        ensure_directories()

        # Check and install dependencies
        logger.debug("Checking dependencies")
        install_dependencies()

        # Run pipeline steps with timing information
        step_start = datetime.now()
        logger.info("Step 1/4: Downloading video segment")
        download_segment(url=url, start=start, duration=duration)
        logger.info(f"Video download completed in {(datetime.now() - step_start).total_seconds():.1f} seconds")

        step_start = datetime.now()
        logger.info("Step 2/4: Extracting frames")
        frame_count = extract_frames(fps=settings.DEFAULT_FPS)
        logger.info(f"Frame extraction completed in {(datetime.now() - step_start).total_seconds():.1f} seconds. Extracted {frame_count} frames")

        step_start = datetime.now()
        logger.info("Step 3/4: Running Meshroom for 3D reconstruction")
        run_meshroom()
        logger.info(f"Meshroom processing completed in {(datetime.now() - step_start).total_seconds():.1f} seconds")

        step_start = datetime.now()
        logger.info("Step 4/4: Collecting and exporting 3D models")
        exports = collect_exports()
        logger.info(f"Export collection completed in {(datetime.now() - step_start).total_seconds():.1f} seconds. Exported {len(exports)} files")

        total_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"Pipeline completed successfully in {total_time:.1f} seconds ({total_time/60:.1f} minutes)")

        # Return the list of exported files
        return exports
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        # Re-raise the exception to be handled by the caller
        raise
