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

## Prerequisites

- Python 3.8+
- FFmpeg
- Meshroom
- System dependencies (see Installation)

## Installation

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

3. Install dependencies:
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
Create a `.env` file in the project root with the following content:
```env
SECRET_KEY=your-secret-key-here
DEBUG=False
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
```

## Usage

1. Start the API server:
```bash
python parachute_3d_pipeline.py
```

2. The API will be available at `http://localhost:8000`

3. API Documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### API Endpoints

- `POST /token` - Get authentication token
- `POST /launch` - Start a new processing job
- `GET /exports` - List available exports
- `GET /health` - Health check endpoint

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

## Development

### Running Tests

```bash
pytest
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

## Production Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a proper WSGI server (e.g., Gunicorn)
3. Set up a reverse proxy (e.g., Nginx)
4. Configure SSL/TLS
5. Set up proper authentication
6. Configure monitoring and logging
7. Set up backup procedures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## GitHub Integration

To upload the code to GitHub, use the following scripts:

1.  Initialize a Git repository:
    ```bash
    ./init_repo.sh
    ```
2.  Add and commit the files:
    ```bash
    ./commit_files.sh
    ```
3.  Create a GitHub repository:
    ```bash
    ./create_repo.sh
    ```
4.  Push the code to GitHub:
    ```bash
    ./push_code.sh
    ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Meshroom](https://github.com/alicevision/meshroom) for 3D reconstruction
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [FFmpeg](https://ffmpeg.org/) for video processing
