#!/bin/bash
set -e  # Exit on error

# Print colorful messages
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

print_header() {
    echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_header "Setting up Parachute 3D Pipeline"

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
if [[ "$python_version" < "3.8" ]]; then
    print_error "Python 3.8 or higher is required. Found: $python_version"
    exit 1
fi
echo "Python version: $python_version ✓"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_header "Creating Python virtual environment"
    python3 -m venv venv
    echo "Virtual environment created ✓"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "Virtual environment activated ✓"

# Install Python dependencies
print_header "Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt
echo "Python dependencies installed ✓"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_header "Creating .env file from template"
    cp .env.example .env
    echo "Created .env file ✓"
    print_warning "Please edit .env file with your specific settings."
fi

# Load environment variables
source .env 2>/dev/null || true

# Create necessary directories
print_header "Creating necessary directories"

# Extract directory paths from .env file
BASE_DIR=$(grep BASE_DIR .env | cut -d= -f2)
EXPORT_DIR=$(grep EXPORT_DIR .env | cut -d= -f2)
FRAMES_DIR="$BASE_DIR/frames"
OUTPUT_DIR="$BASE_DIR/meshroom_output"

# Create directories
mkdir -p "$BASE_DIR"
mkdir -p "$FRAMES_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$EXPORT_DIR"

echo "Created directories:"
echo " - Base directory: $BASE_DIR ✓"
echo " - Frames directory: $FRAMES_DIR ✓"
echo " - Output directory: $OUTPUT_DIR ✓"
echo " - Export directory: $EXPORT_DIR ✓"

# Check for Meshroom installation
print_header "Checking for Meshroom"
MESHROOM_BIN=$(grep MESHROOM_BIN .env | cut -d= -f2)
if [ ! -f "$MESHROOM_BIN" ]; then
    print_warning "Meshroom not found at $MESHROOM_BIN"
    print_warning "Please install Meshroom and update the MESHROOM_BIN path in your .env file."
    echo "You can download Meshroom from: https://github.com/alicevision/meshroom/releases"
else
    echo "Meshroom found at $MESHROOM_BIN ✓"
fi

# Check for ffmpeg installation
print_header "Checking for FFmpeg"
if ! command -v ffmpeg &> /dev/null; then
    print_warning "ffmpeg not found. Attempting to install..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
        echo "FFmpeg installed ✓"
    elif command -v brew &> /dev/null; then
        brew install ffmpeg
        echo "FFmpeg installed ✓"
    else
        print_error "Could not install FFmpeg automatically."
        print_warning "Please install FFmpeg manually: https://ffmpeg.org/download.html"
    fi
else
    echo "FFmpeg found ✓"
fi

# Check for yt-dlp installation
print_header "Checking for yt-dlp"
if ! command -v yt-dlp &> /dev/null; then
    print_warning "yt-dlp not found. Installing via pip..."
    pip install yt-dlp
    echo "yt-dlp installed ✓"
else
    echo "yt-dlp found ✓"
fi

# Setup frontend
print_header "Setting up frontend"
mkdir -p frontend/dist

if [ -d "frontend" ] && [ ! -f "frontend/package.json" ]; then
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_warning "npm not found. Frontend setup will be skipped."
        print_warning "Please install Node.js and npm to set up the frontend: https://nodejs.org/"
    else
        echo "Setting up React frontend..."
        cd frontend
        npm init -y
        npm install @octokit/rest @react-three/drei @react-three/fiber axios react react-dom react-dropzone react-router-dom three
        npm install -D @vitejs/plugin-react vite
        cd ..

        # Create Vite config
        cat > frontend/vite.config.js << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
EOL
        echo "Frontend setup complete! ✓"
    fi
else
    echo "Frontend already initialized or not needed. ✓"
fi

# Create a basic index.html if it doesn't exist
if [ ! -f "frontend/dist/index.html" ]; then
    mkdir -p frontend/dist
    cat > frontend/dist/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parachute 3D Pipeline</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #2c3e50;
        }
        .api-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 15px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Parachute 3D Pipeline</h1>
    <p>Welcome to the Parachute 3D Pipeline service. This tool allows you to convert video segments into 3D models using photogrammetry techniques.</p>
    <p>The API is running and ready to accept requests.</p>
    <a href="/docs" class="api-link">View API Documentation</a>
</body>
</html>
EOL
    echo "Created basic frontend page ✓"
fi

print_header "Setup Complete!"
echo "You can now run the application with:"
echo "python parachute_3d_pipeline.py"

echo -e "\nAfter starting the server:"
echo " - API will be available at: http://localhost:8000"
echo " - API documentation: http://localhost:8000/docs"
echo " - Frontend: http://localhost:8000/static/index.html"