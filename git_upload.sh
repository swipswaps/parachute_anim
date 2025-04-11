#!/bin/bash

# Simple Git Upload Script
# This script initializes a Git repository and pushes it to GitHub

# Set default values
REPO_NAME="parachute_anim"
GITHUB_USER="swipswaps"

# Display help
show_help() {
  echo "Simple Git Upload Script"
  echo ""
  echo "Usage:"
  echo "  ./git_upload.sh [--repo=REPO_NAME] [--user=USERNAME]"
  echo ""
  echo "Options:"
  echo "  --repo=REPO_NAME  Repository name (default: parachute_anim)"
  echo "  --user=USERNAME   GitHub username (default: swipswaps)"
  echo "  --help            Show this help"
  echo ""
  echo "Example:"
  echo "  ./git_upload.sh --repo=my_project --user=johndoe"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --help)
      show_help
      exit 0
      ;;
    --repo=*)
      REPO_NAME="${1#*=}"
      shift
      ;;
    --user=*)
      GITHUB_USER="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

echo "Repository name: $REPO_NAME"
echo "GitHub username: $GITHUB_USER"

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing Git repository..."
  git init
  git config user.name "GitHub Upload Script"
  git config user.email "noreply@github.com"
else
  echo "Git repository already initialized."
fi

# Add all files to the repository
echo "Adding files to the repository..."
git add .

# Commit the changes
echo "Committing changes..."
git commit -m "Initial commit"

# Add GitHub remote
echo "Adding GitHub remote..."
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin master

echo "Done! Repository pushed to https://github.com/$GITHUB_USER/$REPO_NAME"
