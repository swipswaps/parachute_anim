#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please run setup.sh first."
    exit 1
fi

# Load environment variables
source .env

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Error: Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check for required arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <video_url> <start_time> <duration>"
    echo "Example: $0 https://www.youtube.com/watch?v=example 00:00:19 5"
    exit 1
fi

# Run the pipeline
python run_pipeline.py "$@"

# Deactivate virtual environment
deactivate