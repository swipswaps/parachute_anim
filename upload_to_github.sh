#!/bin/bash

# GitHub Repository Upload Script
# This script uploads the entire repository to GitHub

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to use this script."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

# Display help if no arguments are provided
if [ $# -eq 0 ]; then
    echo "GitHub Repository Upload Utility"
    echo ""
    echo "Usage:"
    echo "  ./upload_to_github.sh --token=YOUR_GITHUB_TOKEN --repo=REPO_NAME [--owner=OWNER] [--private] [--batchSize=SIZE] [--concurrency=NUM] [--delay=MS]"
    echo ""
    echo "Required Options:"
    echo "  --token       GitHub personal access token (required)"
    echo "  --repo        Repository name (required)"
    echo ""
    echo "Repository Options:"
    echo "  --owner       GitHub username or organization (default: swipswaps)"
    echo "  --private     Make the repository private (default: false)"
    echo ""
    echo "Batch Processing Options:"
    echo "  --batchSize    Number of files to upload in each batch (default: 5)"
    echo "  --concurrency  Number of concurrent uploads (default: 2)"
    echo "  --delay        Delay between batches in milliseconds (default: 1000)"
    echo ""
    echo "Other Options:"
    echo "  --help        Show this help"
    echo ""
    echo "Example:"
    echo "  ./upload_to_github.sh --token=ghp_xxxxxxxxxxxx --repo=parachute_anim --batchSize=10 --concurrency=3"
    exit 0
fi

# Make the script executable
chmod +x upload_to_github.js

# Run the Node.js script with the provided arguments
node upload_to_github.js "$@"
