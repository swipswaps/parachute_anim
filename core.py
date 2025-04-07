# /usr/local/lib/parachute/core.py
# note pathnames are required
  1 | import subprocess
  2 | import os
  3 | import sys
  4 | import shutil
  5 | from pathlib import Path
  6 | from datetime import datetime
  7 | from typing import List, Optional, Dict, Any
  8 | from loguru import logger
  9 | from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

 10 | from config import settings
 11 | 
 12 | WORK_DIR = Path.home() / "parachute_3d_project"
 13 | FRAMES_DIR = WORK_DIR / "frames"
 14 | VIDEO_SEGMENT = WORK_DIR / "video_segment.mp4"
 15 | OUTPUT_DIR = WORK_DIR / "meshroom_output"
 16 | EXPORT_DIR = Path.home() / "3d_exports"
 17 | AUDIT_LOG = WORK_DIR / "audit.log"
 18 | MESHROOM_BIN = "/usr/local/bin/meshroom_batch"
 19 | 
 20 | # Configure logging
 21 | logger.remove()
 22 | logger.add(
 23 |     settings.AUDIT_LOG,
 24 |     format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
 25 |     level="INFO",
 26 |     rotation="1 day",
 27 |     retention="7 days"
 28 | )
 29 | logger.add(sys.stderr, level="INFO")
 30 | 
 31 | class PipelineError(Exception):
 32 |     """Base exception for pipeline errors."""
 33 |     pass
 34 | 
 35 | class VideoDownloadError(PipelineError):
 36 |     """Raised when video download fails."""
 37 |     pass
 38 | 
 39 | class FrameExtractionError(PipelineError):
 40 |     """Raised when frame extraction fails."""
 41 |     pass
 42 | 
 43 | class MeshroomError(PipelineError):
 44 |     """Raised when Meshroom processing fails."""
 45 |     pass
 46 | 
 47 | class DependencyError(PipelineError):
 48 |     """Raised when dependency installation or verification fails."""
 49 |     pass
 50 | 
 51 | class FileSystemError(PipelineError):
 52 |     """Raised when file system operations fail."""
 53 |     pass
 54 | 
 55 | def check_command_exists(command: str) -> bool:
 56 |     """Check if a command exists in the system PATH."""
 57 |     return shutil.which(command) is not None
 58 | 
 59 | def check_dependencies() -> Dict[str, bool]:
 60 |     """Check if all required dependencies are installed."""
 61 |     dependencies = {
 62 |         "ffmpeg": check_command_exists("ffmpeg"),
 63 |         "yt-dlp": check_command_exists("yt-dlp"),
 64 |         "meshroom": check_command_exists(settings.MESHROOM_BIN)
 65 |     }
 66 |     return dependencies
 67 | 
 68 | def ensure_directories() -> None:
 69 |     """Ensure all required directories exist and are writable."""
 70 |     try:
 71 |         for directory in [
 72 |             settings.BASE_DIR,
 73 |             settings.FRAMES_DIR,
 74 |             settings.VIDEO_SEGMENT.parent,
 75 |             settings.OUTPUT_DIR,
 76 |             settings.EXPORT_DIR
 77 |         ]:
 78 |             directory.mkdir(parents=True, exist_ok=True)
 79 |             # Test if directory is writable
 80 |             test_file = directory / ".write_test"
 81 |             test_file.touch()
 82 |             test_file.unlink()
 83 |     except Exception as e:
 84 |         logger.error(f"Directory creation or permission error: {e}")
 85 |         raise FileSystemError(f"Failed to create or access directories: {e}")
 86 | 
 87 | @retry(
 88 |     stop=stop_after_attempt(3),
 89 |     wait=wait_exponential(multiplier=1, min=4, max=10),
 90 |     retry=retry_if_exception_type(subprocess.SubprocessError)
 91 | )
 92 | def run_command(command: List[str], shell: bool = False, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
 93 |     """Run a subprocess command with logging and error detection."""
 94 |     logger.info(f"Executing command: {' '.join(command)}")
 95 |     try:
 96 |         result = subprocess.run(
 97 |             command,
 98 |             shell=shell,
 99 |             capture_output=True,
100 |             text=True,
101 |             cwd=cwd,
102 |             check=False  # We'll handle the error ourselves
103 |         )
104 |         if result.returncode != 0:
105 |             logger.error(f"Command failed: {result.stderr}")
106 |             raise subprocess.CalledProcessError(result.returncode, command, result.stdout, result.stderr)
107 |         return result
108 |     except subprocess.SubprocessError as e:
109 |         logger.error(f"Subprocess error: {str(e)}")
110 |         raise
111 | 
112 | def install_dependencies() -> None:
113 |     """Install required packages using apt and pip."""
114 |     try:
115 |         # Check if we need to install dependencies
116 |         dependencies = check_dependencies()
117 |         if all(dependencies.values()):
118 |             logger.info("All dependencies are already installed")
119 |             return
120 | 
121 |         # Install system dependencies if needed
122 |         if not dependencies["ffmpeg"]:
123 |             logger.info("Installing ffmpeg...")
124 |             run_command(["sudo", "apt-get", "update"])
125 |             run_command(["sudo", "apt-get", "install", "-y", "ffmpeg"])
126 |         
127 |         # Install Python dependencies if needed
128 |         if not dependencies["yt-dlp"]:
129 |             logger.info("Installing yt-dlp...")
130 |             run_command([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"])
131 |         
132 |         # Verify Meshroom installation
133 |         if not dependencies["meshroom"]:
134 |             logger.error("Meshroom is not installed or not in PATH")
135 |             raise DependencyError("Meshroom is not installed or not in PATH. Please install it manually.")
136 |         
137 |         logger.info("Dependencies installed successfully")
138 |     except subprocess.CalledProcessError as e:
139 |         logger.error(f"Failed to install dependencies: {e}")
140 |         raise DependencyError(f"Dependency installation failed: {e}")
141 | 
142 | @retry(
143 |     stop=stop_after_attempt(3),
144 |     wait=wait_exponential(multiplier=1, min=4, max=10),
145 |     retry=retry_if_exception_type((subprocess.CalledProcessError, VideoDownloadError))
146 | )
147 | def download_segment(url: str, start: str, duration: int) -> None:
148 |     """Download a segment from a YouTube video using yt-dlp and ffmpeg."""
149 |     if duration > settings.MAX_DURATION:
150 |         raise ValueError(f"Duration exceeds maximum allowed time of {settings.MAX_DURATION} seconds")
151 |     
152 |     logger.info(f"Downloading video segment from {url} (start: {start}, duration: {duration}s)")
153 |     try:
154 |         # Ensure directories exist
155 |         ensure_directories()
156 |         
157 |         # Download video
158 |         temp_file = settings.BASE_DIR / "temp_download.mp4"
159 |         try:
160 |             # First try with yt-dlp
161 |             run_command(["yt-dlp", "-f", "mp4", "-o", str(temp_file), url])
162 |         except subprocess.CalledProcessError:
163 |             # Fallback to youtube-dl if yt-dlp fails
164 |             logger.warning("yt-dlp failed, trying youtube-dl as fallback")
165 |             try:
166 |                 run_command(["youtube-dl", "-f", "mp4", "-o", str(temp_file), url])
167 |             except subprocess.CalledProcessError as e:
168 |                 raise VideoDownloadError(f"Both yt-dlp and youtube-dl failed: {e}")
169 |         
170 |         # Extract segment
171 |         run_command([
172 |             "ffmpeg", "-y", "-ss", start, "-i", str(temp_file),
173 |             "-t", str(duration), str(settings.VIDEO_SEGMENT)
174 |         ])
175 |         
176 |         # Clean up
177 |         temp_file.unlink(missing_ok=True)
178 |         logger.info("Video segment downloaded successfully")
179 |     except subprocess.CalledProcessError as e:
180 |         logger.error(f"Failed to download video segment: {e}")
181 |         raise VideoDownloadError(f"Video download failed: {e}")
182 |     except Exception as e:
183 |         logger.error(f"Unexpected error during video download: {e}")
184 |         raise VideoDownloadError(f"Unexpected error during video download: {e}")
185 | 
186 | def extract_frames(fps: int = settings.DEFAULT_FPS) -> None:
187 |     """Extract frames from the video segment using ffmpeg."""
188 |     logger.info(f"Extracting frames at {fps} FPS")
189 |     try:
190 |         # Ensure video file exists
191 |         if not settings.VIDEO_SEGMENT.exists():
192 |             raise FileNotFoundError(f"Video file not found: {settings.VIDEO_SEGMENT}")
193 |         
194 |         # Ensure frames directory exists
195 |         ensure_directories()
196 |         
197 |         # Extract frames
198 |         run_command([
199 |             "ffmpeg", "-i", str(settings.VIDEO_SEGMENT), "-vf", f"fps={fps}",
200 |             str(settings.FRAMES_DIR / "frame_%04d.jpg")
201 |         ])
202 |         
203 |         # Verify frames were extracted
204 |         frame_count = len(list(settings.FRAMES_DIR.glob("*.jpg")))
205 |         if frame_count == 0:
206 |             raise FrameExtractionError("No frames were extracted")
207 |         
208 |         logger.info(f"Frames extracted successfully: {frame_count} frames")
209 |     except subprocess.CalledProcessError as e:
210 |         logger.error(f"Failed to extract frames: {e}")
211 |         raise FrameExtractionError(f"Frame extraction failed: {e}")
212 |     except Exception as e:
213 |         logger.error(f"Unexpected error during frame extraction: {e}")
214 |         raise FrameExtractionError(f"Unexpected error during frame extraction: {e}")
215 | 
216 | def run_meshroom() -> None:
217 |     """Run Meshroom photogrammetry pipeline."""
218 |     logger.info("Running Meshroom pipeline")
219 |     try:
220 |         # Ensure directories exist
221 |         ensure_directories()
222 |         
223 |         # Check if Meshroom is installed
224 |         if not check_command_exists(settings.MESHROOM_BIN):
225 |             raise MeshroomError(f"Meshroom not found at {settings.MESHROOM_BIN}")
226 |         
227 |         # Check if we have frames to process
228 |         frame_count = len(list(settings.FRAMES_DIR.glob("*.jpg")))
229 |         if frame_count < 10:  # Meshroom typically needs at least 10 frames
230 |             raise MeshroomError(f"Not enough frames for Meshroom processing: {frame_count} frames found")
231 |         
232 |         # Run Meshroom
233 |         run_command([
234 |             settings.MESHROOM_BIN,
235 |             "--input", str(settings.FRAMES_DIR),
236 |             "--output", str(settings.OUTPUT_DIR)
237 |         ])
238 |         
239 |         logger.info("Meshroom pipeline completed successfully")
240 |     except subprocess.CalledProcessError as e:
241 |         logger.error(f"Meshroom pipeline failed: {e}")
242 |         raise MeshroomError(f"Meshroom processing failed: {e}")
243 |     except Exception as e:
244 |         logger.error(f"Unexpected error during Meshroom processing: {e}")
245 |         raise MeshroomError(f"Unexpected error during Meshroom processing: {e}")
246 | 
247 | def collect_exports() -> List[Path]:
248 |     """Find and log all exportable 3D files."""
249 |     logger.info("Collecting export files")
250 |     exported = []
251 |     try:
252 |         # Ensure directories exist
253 |         ensure_directories()
254 |         
255 |         # Check if we have any output files
256 |         if not settings.OUTPUT_DIR.exists() or not any(settings.OUTPUT_DIR.iterdir()):
257 |             logger.warning("No output files found from Meshroom processing")
258 |             return []
259 |         
260 |         # Collect exports
261 |         for ext in settings.SUPPORTED_EXPORT_FORMATS:
262 |             for file in settings.OUTPUT_DIR.rglob(f"*{ext}"):
263 |                 destination = settings.EXPORT_DIR / file.name
264 |                 destination.write_bytes(file.read_bytes())
265 |                 logger.info(f"Exported {file.name} to {destination}")
266 |                 exported.append(destination)
267 |         
268 |         if not exported:
269 |             logger.warning("No exportable files found")
270 |         
271 |         return exported
272 |     except Exception as e:
273 |         logger.error(f"Failed to collect exports: {e}")
274 |         raise PipelineError(f"Export collection failed: {e}")
275 | 
276 | def pipeline(url: str, start: str, duration: int) -> List[Path]:
277 |     """Execute the full 3D processing pipeline."""
278 |     logger.info("Starting 3D processing pipeline")
279 |     try:
280 |         # Initial setup
281 |         ensure_directories()
282 |         
283 |         # Check and install dependencies
284 |         install_dependencies()
285 |         
286 |         # Run pipeline steps
287 |         download_segment(url=url, start=start, duration=duration)
288 |         extract_frames(fps=settings.DEFAULT_FPS)
289 |         run_meshroom()
290 |         exports = collect_exports()
291 |         
292 |         logger.info("Pipeline completed successfully")
293 |         return exports
294 |     except Exception as e:
295 |         logger.error(f"Pipeline failed: {e}")
296 |         raise
