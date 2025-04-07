#!/usr/bin/env python3
import sys
import argparse
from pathlib import Path
import uvicorn
from loguru import logger

from config import settings

def setup_logging():
    """Configure logging for the application."""
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Parachute 3D Pipeline Launcher")
    parser.add_argument("--host", default=settings.API_HOST, help="Host to bind to")
    parser.add_argument("--port", type=int, default=settings.API_PORT, help="Port to bind to")
    parser.add_argument("--workers", type=int, default=settings.API_WORKERS, help="Number of worker processes")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    return parser.parse_args()

def main():
    """Main entry point for the application."""
    setup_logging()
    args = parse_args()
    
    logger.info("Starting Parachute 3D Pipeline API server...")
    try:
        uvicorn.run(
            "api:app",
            host=args.host,
            port=args.port,
            workers=args.workers,
            reload=args.debug
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
