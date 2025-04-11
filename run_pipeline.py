#!/usr/bin/env python3
import subprocess
import requests
import json
import argparse
import os
import time
import venv  # Import the venv module

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

def check_python():
    try:
        subprocess.run(["python3", "--version"], check=True, capture_output=True)
        print("Python 3 is installed.")
        return True
    except FileNotFoundError:
        print("Python 3 is not installed. Please install it and try again.")
        return False

def create_virtual_environment():
    venv_dir = "venv"
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        venv.create(venv_dir, with_pip=True)
        print("Virtual environment created.")
        install_dependencies()  # Install dependencies after creating the venv
    else:
        print("Virtual environment already exists.")

def activate_virtual_environment():
    print("Activating virtual environment...")
    activate_script = os.path.join("venv", "bin", "activate")
    if os.path.exists(activate_script):
        # This doesn't actually activate the venv in the current process,
        # but it ensures the script knows where to find its dependencies
        os.environ["VIRTUAL_ENV"] = os.path.abspath("venv")
        os.environ["PATH"] = os.path.join("venv", "bin") + os.pathsep + os.environ["PATH"]
        print("Virtual environment activated.")
    else:
        print("Virtual environment activation script not found.")

def install_dependencies():
    print("Installing dependencies...")
    venv_dir = "venv"
    pip_executable = os.path.join(venv_dir, "bin", "pip")
    try:
        subprocess.run([pip_executable, "install", "-r", "requirements.txt"], check=True)
        print("Dependencies installed.")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        exit(1)

def check_meshroom():
    meshroom_bin = os.getenv("MESHROOM_BIN", "/usr/local/bin/meshroom_batch")
    if not os.path.exists(meshroom_bin):
        print("Meshroom is not installed or MESHROOM_BIN is not set correctly.")
        print("Please install Meshroom and set the MESHROOM_BIN variable in the .env file.")
        return False
    else:
        print("Meshroom is installed.")
        return True

def start_api_server():
    print("Starting API server...")
    venv_python = "venv/bin/python3"
    try:
        process = subprocess.Popen([venv_python, "parachute_3d_pipeline.py"])
        time.sleep(5)  # Wait for the server to start
        
        # Check if the server is running
        try:
            response = requests.get(f"http://{API_HOST}:{API_PORT}/health")
            response.raise_for_status()
            print("API server started successfully.")
            return process
        except requests.exceptions.RequestException as e:
            print(f"Error starting API server: {e}")
            process.terminate()
            process.wait()
            exit(1)
    except FileNotFoundError:
        print("Virtual environment not found. Please create and activate it.")
        exit(1)

def get_token():
    print("Getting authentication token...")
    token_url = f"http://{API_HOST}:{API_PORT}/token"
    data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        return response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        print(f"Error getting authentication token: {e}")
        exit(1)

def launch_job(video_url, start_time, duration, token):
    print("Launching processing job...")
    launch_url = f"http://{API_HOST}:{API_PORT}/launch"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    data = {
        "video_url": video_url,
        "start_time": start_time,
        "duration": duration,
    }
    try:
        response = requests.post(launch_url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error launching job: {e}")
        exit(1)

def main():
    parser = argparse.ArgumentParser(description="Automate the Parachute 3D Pipeline")
    parser.add_argument("video_url", help="YouTube video URL")
    parser.add_argument("start_time", help="Start time in HH:MM:SS format")
    parser.add_argument("duration", type=int, help="Duration in seconds")
    args = parser.parse_args()

    if not check_python():
        exit(1)

    create_virtual_environment()
    install_dependencies()

    if not check_meshroom():
        exit(1)

    api_server_process = start_api_server()
    try:
        token = get_token()
        job_response = launch_job(args.video_url, args.start_time, args.duration, token)
        print(json.dumps(job_response, indent=4))
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
    finally:
        print("Stopping API server...")
        api_server_process.terminate()
        api_server_process.wait()

if __name__ == "__main__":
    main()
