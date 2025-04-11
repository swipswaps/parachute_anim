#!/bin/bash

# GitHub Repository Upload Script using GitHub CLI (gh) with rate limiting
# This script uploads the entire repository to GitHub using the built-in GitHub CLI

# Set default values
OWNER="swipswaps"
REPO=""
PRIVATE=false
DESCRIPTION="Parachute 3D Pipeline - A system that processes video segments into 3D models using photogrammetry"
BATCH_SIZE=5
DELAY=5  # Delay between batches in seconds
PROGRESS=true

# Display help
show_help() {
  echo "GitHub Repository Upload Utility (using GitHub CLI)"
  echo ""
  echo "Usage:"
  echo "  ./gh_upload_with_rate_limiting.sh --repo=REPO_NAME [--owner=OWNER] [--private] [--description=DESC] [--batch-size=SIZE] [--delay=SECONDS] [--no-progress]"
  echo ""
  echo "Required Options:"
  echo "  --repo        Repository name (required)"
  echo ""
  echo "Repository Options:"
  echo "  --owner       GitHub username or organization (default: swipswaps)"
  echo "  --private     Make the repository private (default: false)"
  echo "  --description Repository description"
  echo ""
  echo "Upload Options:"
  echo "  --batch-size  Number of files to commit in each batch (default: 5)"
  echo "  --delay       Delay between batches in seconds (default: 5)"
  echo "  --no-progress Don't show progress during upload"
  echo ""
  echo "Other Options:"
  echo "  --help        Show this help"
  echo ""
  echo "Example:"
  echo "  ./gh_upload_with_rate_limiting.sh --repo=parachute_anim --private --batch-size=3 --delay=10"
  echo ""
  echo "Note: This script requires the GitHub CLI (gh) to be installed and authenticated."
  echo "      Run 'gh auth status' to check your authentication status."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --help)
      show_help
      exit 0
      ;;
    --repo=*)
      REPO="${1#*=}"
      shift
      ;;
    --owner=*)
      OWNER="${1#*=}"
      shift
      ;;
    --private)
      PRIVATE=true
      shift
      ;;
    --description=*)
      DESCRIPTION="${1#*=}"
      shift
      ;;
    --batch-size=*)
      BATCH_SIZE="${1#*=}"
      shift
      ;;
    --delay=*)
      DELAY="${1#*=}"
      shift
      ;;
    --no-progress)
      PROGRESS=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$REPO" ]; then
  echo "Error: Repository name is required (--repo=REPO_NAME)"
  show_help
  exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Please install it from https://cli.github.com/"
  exit 1
fi

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
  echo "Error: You are not authenticated with GitHub CLI."
  echo "Please run 'gh auth login' to authenticate."
  exit 1
fi

# Get the repository root directory
REPO_ROOT=$(pwd)
echo "Repository root: $REPO_ROOT"

# Function to create a repository
create_repository() {
  local visibility="--public"
  if [ "$PRIVATE" = true ]; then
    visibility="--private"
  fi

  echo "Creating repository $OWNER/$REPO..."
  gh repo create "$OWNER/$REPO" $visibility --description "$DESCRIPTION" --source=. --remote=origin

  if [ $? -ne 0 ]; then
    echo "Error: Failed to create repository."
    exit 1
  fi

  echo "Repository created successfully: https://github.com/$OWNER/$REPO"
}

# Function to check if a repository exists
repository_exists() {
  gh repo view "$OWNER/$REPO" &> /dev/null
  return $?
}

# Function to get all files in a directory recursively
get_all_files() {
  local dir=$1
  find "$dir" -type f \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/AliceVision/*" \
    -not -path "*/OpenFOAM*/*" \
    -not -path "*/.env" \
    -not -path "*/*.pem" \
    -not -path "*/*.key" \
    -not -path "*/*.crt" \
    -not -path "*/.config/gh/*" \
    | sort
}

# Function to upload files in batches with rate limiting
upload_files_in_batches() {
  local files=("$@")
  local total_files=${#files[@]}
  local batches=$(( (total_files + BATCH_SIZE - 1) / BATCH_SIZE ))
  local uploaded=0

  echo "Found $total_files files to upload in $batches batches"
  echo "Using batch size of $BATCH_SIZE with $DELAY seconds delay between batches"

  # Initialize git repository if needed
  if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git config user.name "GitHub Upload Script"
    git config user.email "noreply@github.com"
  fi

  # Add remote if it doesn't exist
  if ! git remote | grep -q "^origin$"; then
    echo "Adding remote origin..."
    git remote add origin "https://github.com/$OWNER/$REPO.git"
  fi

  # Process files in batches
  for ((i=0; i<total_files; i+=BATCH_SIZE)); do
    local end=$((i + BATCH_SIZE))
    if [ $end -gt $total_files ]; then
      end=$total_files
    fi

    local batch_num=$((i / BATCH_SIZE + 1))
    echo "Processing batch $batch_num/$batches (files $((i+1))-$end of $total_files)..."

    # Add files in this batch
    for ((j=i; j<end; j++)); do
      local file="${files[j]}"
      git add "$file"

      if [ "$PROGRESS" = true ]; then
        uploaded=$((uploaded + 1))
        echo "Added file $uploaded/$total_files: $file"
      fi
    done

    # Commit this batch
    git commit -m "Batch $batch_num: Add files $((i+1))-$end of $total_files"

    # Push to GitHub with retry logic
    echo "Pushing batch $batch_num to GitHub..."
    local retry_count=0
    local max_retries=3

    while [ $retry_count -lt $max_retries ]; do
      if git push -u origin main; then
        echo "✅ Batch $batch_num pushed successfully!"
        break
      else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
          echo "⚠️ Push failed, retrying in 30 seconds (attempt $retry_count of $max_retries)..."
          sleep 30
        else
          echo "❌ Failed to push after $max_retries attempts."
          echo "Please try pushing manually with: git push -u origin main"
          exit 1
        fi
      fi
    done

    # Rate limiting: sleep between batches
    if [ $batch_num -lt $batches ]; then
      echo "Waiting $DELAY seconds before next batch to avoid rate limiting..."
      sleep $DELAY
    fi
  done

  echo "✅ Upload complete!"
  echo "Repository URL: https://github.com/$OWNER/$REPO"
}

# Main script
echo "🚀 Starting GitHub repository upload using GitHub CLI with rate limiting"
echo "Repository: $OWNER/$REPO"
echo "Private: $([ "$PRIVATE" = true ] && echo "Yes" || echo "No")"
echo "Batch size: $BATCH_SIZE"
echo "Delay between batches: $DELAY seconds"

# Check if the repository exists
if repository_exists; then
  echo "Repository $OWNER/$REPO already exists"
else
  echo "Repository $OWNER/$REPO does not exist, creating..."
  create_repository
fi

# Get all files in the repository
echo "Scanning repository files..."
mapfile -t files < <(get_all_files "$REPO_ROOT")

# Upload files in batches
upload_files_in_batches "${files[@]}"

echo "To clone this repository:"
echo "git clone https://github.com/$OWNER/$REPO.git"
