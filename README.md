# Parachute 3D Pipeline

A robust API service for processing video segments into 3D models using photogrammetry techniques.

## Features

- YouTube video segment downloading
- Frame extraction from videos
- 3D model generation using Meshroom
- Multiple export formats (OBJ, STL, GLB, PLY)
- RESTful API with authentication
- Comprehensive error handling and logging
- Configurable processing parameters
- React-based frontend for model visualization

## Prerequisites

- Python 3.8+
- FFmpeg
- Meshroom (AliceVision)
- Node.js and npm (for frontend development)
- System dependencies (see Installation)

## Installation

### Automatic Installation

The easiest way to install is using the provided setup script:

```bash
./setup.sh
```

This script will:
1. Create a Python virtual environment
2. Install all required Python dependencies
3. Create a `.env` file from the template if it doesn't exist
4. Set up the frontend development environment
5. Check for required system dependencies

### Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/swipswaps/parachute_3d_pipeline.git
cd parachute_3d_pipeline
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install system dependencies:
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

5. Install Meshroom:
Follow the instructions at [Meshroom's official website](https://github.com/alicevision/meshroom) to install Meshroom.

6. Configure the application:
Create a `.env` file in the project root by copying the template:
```bash
cp .env.example .env
```
Then edit the `.env` file to match your environment.

7. Set up the frontend (optional):
```bash
cd frontend
npm install
```

## Configuration

The application is configured through environment variables, which can be set in the `.env` file. The most important settings are:

- `API_HOST` and `API_PORT`: Control where the API server listens
- `SECRET_KEY`: Used for JWT token encryption (change this in production!)
- `ADMIN_USERNAME` and `ADMIN_PASSWORD`: API authentication credentials (change these in production!)
- `MESHROOM_BIN`: Path to the Meshroom binary
- `BASE_DIR` and `EXPORT_DIR`: Directories for storing temporary and output files

See `.env.example` for a complete list of configuration options.

## Usage

### Running the API Server

1. Start the API server:
```bash
python parachute_3d_pipeline.py
```

2. The API will be available at `http://localhost:8000`

3. API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Running the Pipeline Directly

You can also run the pipeline directly using the provided script:

```bash
./run.sh https://www.youtube.com/watch?v=example 00:00:19 5
```

This will:
1. Download the specified YouTube video
2. Extract a segment starting at 00:00:19 for 5 seconds
3. Extract frames from the video segment
4. Process the frames with Meshroom to create a 3D model
5. Export the model in multiple formats

### API Endpoints

#### Authentication

- `POST /token` - Get authentication token
  - Request body: `username` and `password` as form data
  - Response: JWT token

#### Core API

- `POST /launch` - Start a new processing job
  - Request body: JSON with `video_url`, `start_time`, and `duration`
  - Authentication: Bearer token required
  - Response: Job ID and status

- `GET /exports` - List available exports
  - Authentication: Bearer token required
  - Response: List of exported model filenames

- `GET /health` - Health check endpoint
  - No authentication required
  - Response: Status and timestamp

#### Frontend API

- `POST /api/videos/upload` - Upload a video file
  - Request body: Multipart form with video file, start_time, and duration
  - Response: Status of the processing job

- `GET /api/models/{model_id}` - Get information about a specific model
  - Response: Model details including download URLs

- `GET /api/models` - List all available models
  - Response: List of model information

### Example Usage

1. Get an authentication token:
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"
```

2. Launch a processing job:
```bash
curl -X POST "http://localhost:8000/launch" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "start_time": "00:00:19",
    "duration": 5
  }'
```

## Project Structure

- `api.py`: FastAPI application and route definitions
- `config.py`: Configuration settings using Pydantic
- `core.py`: Core pipeline functionality
- `parachute_3d_pipeline.py`: Main entry point for the API server
- `run_pipeline.py`: CLI tool for running the pipeline
- `frontend/`: React frontend for model visualization
- `tests/`: Unit and integration tests

## Development

### Running Tests

```bash
pytest
```

For more detailed test output:

```bash
pytest -v
```

To run tests with coverage reporting:

```bash
pytest --cov=.
```

### Code Style

The project uses:
- Black for code formatting
- isort for import sorting
- mypy for type checking

Run the formatters:
```bash
black .
isort .
mypy .
```

### Frontend Development

To start the frontend development server:

```bash
cd frontend
npm run dev
```

To build the frontend for production:

```bash
cd frontend
npm run build
```

## Production Deployment

For production deployment:

1. Set appropriate environment variables in `.env`:
   - Change `SECRET_KEY` to a secure random value
   - Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` to secure values
   - Set `DEBUG=False`

2. Use a proper WSGI server (e.g., Gunicorn):
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api:app
```

3. Set up a reverse proxy (e.g., Nginx) to handle SSL/TLS termination

4. Configure monitoring and logging

5. Set up backup procedures for the exported models

## Troubleshooting

### Common Issues

1. **Meshroom not found**: Ensure the `MESHROOM_BIN` path in your `.env` file is correct

2. **FFmpeg missing**: Install FFmpeg using your system's package manager

3. **Permission errors**: Ensure the directories specified in `.env` are writable

4. **Not enough frames**: Meshroom typically needs at least 10 good frames to create a 3D model

### Logs

Check the following logs for troubleshooting:

- API logs: Standard output when running the server
- Pipeline logs: `<BASE_DIR>/audit.log`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Meshroom](https://github.com/alicevision/meshroom) for 3D reconstruction
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [FFmpeg](https://ffmpeg.org/) for video processing
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D visualization
