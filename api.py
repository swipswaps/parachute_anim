#!/usr/bin/env python3

import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from pydantic import BaseModel

from config import settings
from core import pipeline, PipelineError

# Create FastAPI app
app = FastAPI(
    title="Parachute 3D Pipeline API",
    description="API for processing video segments into 3D models using photogrammetry",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="frontend/dist"), name="static")

# Define models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class JobRequest(BaseModel):
    video_url: str
    start_time: str
    duration: int

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

class ModelInfo(BaseModel):
    id: str
    name: str
    url: str
    downloadUrl: str
    format: str
    createdAt: float

# Setup OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Authentication functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

# Background task for video processing
async def process_video(video_path: Path, url: str, start_time: str, duration: int):
    """Process a video in the background.

    This function is designed to be run as a background task with FastAPI's BackgroundTasks.
    It handles the entire pipeline from video download to 3D model export.

    Args:
        video_path: Path to the video file (for direct uploads)
        url: URL of the video (for YouTube downloads)
        start_time: Start time in format HH:MM:SS
        duration: Duration in seconds
    """
    from loguru import logger
    import traceback
    import time

    job_id = f"job_{int(time.time())}"
    logger.info(f"Starting background processing job {job_id}")

    try:
        # If using a direct upload, we need to handle it differently than a URL
        if url == "local_upload" and video_path.exists():
            logger.info(f"Processing uploaded video file: {video_path}")
            # The video is already downloaded, so we can skip to frame extraction
            from core import extract_frames, run_meshroom, collect_exports, ensure_directories

            # Make sure the video is in the right place
            if video_path != settings.VIDEO_SEGMENT:
                import shutil
                ensure_directories()
                shutil.copy2(video_path, settings.VIDEO_SEGMENT)
                logger.info(f"Copied uploaded video to {settings.VIDEO_SEGMENT}")

            # Run the pipeline steps
            frame_count = extract_frames(fps=settings.DEFAULT_FPS)
            logger.info(f"Extracted {frame_count} frames from uploaded video")
            run_meshroom()
            exports = collect_exports()
            logger.info(f"Exported {len(exports)} 3D model files")
        else:
            # Use the full pipeline for YouTube URLs
            logger.info(f"Processing video from URL: {url}")
            exports = pipeline(url=url, start=start_time, duration=duration)
            logger.info(f"Pipeline completed with {len(exports)} exported files")

        logger.info(f"Background job {job_id} completed successfully")
    except Exception as e:
        # Log the error but don't raise it since this is a background task
        logger.error(f"Error in background job {job_id}: {e}")
        logger.error(traceback.format_exc())
        # In a production system, you might want to update a job status database here

# API Routes
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Simple authentication - in production, use a proper user database
    if form_data.username != settings.ADMIN_USERNAME or form_data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/launch", response_model=JobResponse, summary="Launch a new 3D processing job", description="Start a new job to process a video segment into a 3D model")
async def launch_job(job: JobRequest, background_tasks: BackgroundTasks, current_user: TokenData = Depends(get_current_user)):
    """Launch a new 3D processing job.

    This endpoint starts a new background job to process a video segment into a 3D model.
    The job runs asynchronously, and the endpoint returns immediately with a job ID.

    - **video_url**: YouTube URL of the video to process
    - **start_time**: Start time in format HH:MM:SS
    - **duration**: Duration in seconds (max: {settings.MAX_DURATION})

    Returns a job ID that can be used to track the job status.
    """
    try:
        # Validate input
        import re

        # Validate duration
        if job.duration > settings.MAX_DURATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duration exceeds maximum allowed time of {settings.MAX_DURATION} seconds"
            )
        elif job.duration < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duration must be at least 1 second"
            )

        # Validate start time format
        if not re.match(r'^\d{2}:\d{2}:\d{2}$', job.start_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Start time must be in format HH:MM:SS, got: {job.start_time}"
            )

        # Validate video URL (basic check)
        if not job.video_url.startswith(('http://', 'https://')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid video URL: {job.video_url}"
            )

        # Generate a job ID with timestamp for uniqueness
        job_id = f"job_{int(time.time())}"

        # Log the job start
        from loguru import logger
        logger.info(f"Starting job {job_id} for video {job.video_url} at {job.start_time} for {job.duration}s")

        # Start processing in background
        background_tasks.add_task(
            process_video,
            settings.VIDEO_SEGMENT,
            job.video_url,
            job.start_time,
            job.duration
        )

        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Job started successfully. Processing will continue in the background."
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the unexpected error
        from loguru import logger
        import traceback
        logger.error(f"Error launching job: {e}")
        logger.error(traceback.format_exc())

        # Return a sanitized error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while launching the job. Please check the server logs."
        )

@app.get("/exports", response_model=List[str])
async def list_exports(current_user: TokenData = Depends(get_current_user)):
    try:
        if not settings.EXPORT_DIR.exists():
            return []
        return [str(p.name) for p in settings.EXPORT_DIR.glob("*") if p.is_file()]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Frontend API routes
@app.post("/api/videos/upload", summary="Upload a video file", description="Upload a video file for 3D processing")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="The video file to upload"),
    start_time: str = Form("00:00:00", description="Start time in format HH:MM:SS"),
    duration: int = Form(10, description=f"Duration in seconds (max: {settings.MAX_DURATION})")
):
    """Upload a video file for 3D processing.

    This endpoint allows uploading a video file directly instead of providing a YouTube URL.
    The video will be processed in the background to create a 3D model.

    - **video**: The video file to upload
    - **start_time**: Start time in format HH:MM:SS (default: 00:00:00)
    - **duration**: Duration in seconds (default: 10, max: {settings.MAX_DURATION})

    Returns the filename and processing status.
    """
    try:
        # Validate input
        import re

        # Validate duration
        if duration > settings.MAX_DURATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duration exceeds maximum allowed time of {settings.MAX_DURATION} seconds"
            )
        elif duration < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duration must be at least 1 second"
            )

        # Validate start time format
        if not re.match(r'^\d{2}:\d{2}:\d{2}$', start_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Start time must be in format HH:MM:SS, got: {start_time}"
            )

        # Validate file type (basic check)
        if not video.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported video format. Supported formats: MP4, AVI, MOV, MKV, WEBM"
            )

        # Generate a unique filename to prevent conflicts
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"upload_{timestamp}_{video.filename}"
        video_path = settings.BASE_DIR / unique_filename

        # Ensure directory exists
        from core import ensure_directories
        ensure_directories()

        # Save the uploaded video
        from loguru import logger
        logger.info(f"Saving uploaded video to {video_path}")

        # Save in chunks for large files
        with open(video_path, "wb") as buffer:
            chunk_size = 1024 * 1024  # 1MB chunks
            content = await video.read(chunk_size)
            while content:
                buffer.write(content)
                content = await video.read(chunk_size)

        # Generate a job ID
        job_id = f"job_{int(time.time())}"

        # Start processing in background
        logger.info(f"Starting background processing job {job_id} for uploaded video {video.filename}")
        background_tasks.add_task(
            process_video,
            video_path,
            "local_upload",  # No URL since we're uploading directly
            start_time,
            duration
        )

        return {
            "filename": video.filename,
            "job_id": job_id,
            "status": "processing",
            "message": "Video uploaded successfully. Processing will continue in the background."
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the unexpected error
        from loguru import logger
        import traceback
        logger.error(f"Error processing uploaded video: {e}")
        logger.error(traceback.format_exc())

        # Return a sanitized error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the uploaded video."
        )

@app.get("/api/models/{model_id}")
async def get_model(model_id: str):
    # Retrieve model information
    model_path = settings.EXPORT_DIR / f"{model_id}"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model not found")

    # Get available formats
    formats = []
    for ext in settings.SUPPORTED_EXPORT_FORMATS:
        if (model_path.with_suffix(ext)).exists():
            formats.append(ext.lstrip('.'))

    if not formats:
        raise HTTPException(status_code=404, detail="No model formats available")

    return {
        "id": model_id,
        "name": model_path.stem,
        "url": f"/static/models/{model_id}.glb",
        "downloadUrl": f"/static/models/{model_id}.{formats[0]}",
        "format": formats[0],
        "createdAt": os.path.getctime(model_path.with_suffix(f".{formats[0]}"))
    }

@app.get("/api/models")
async def list_models():
    if not settings.EXPORT_DIR.exists():
        return []

    models = []
    for file in settings.EXPORT_DIR.glob("*"):
        if file.is_file() and file.suffix in settings.SUPPORTED_EXPORT_FORMATS:
            models.append({
                "id": file.stem,
                "name": file.stem,
                "format": file.suffix.lstrip('.'),
                "createdAt": os.path.getctime(file)
            })

    return models