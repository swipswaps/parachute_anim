#!/bin/bash
set -e

# Load environment variables
source .env

# Source OpenFOAM environment
if [ -f "$OPENFOAM_DIR/etc/bashrc" ]; then
    source $OPENFOAM_DIR/etc/bashrc
else
    echo "Error: OpenFOAM bashrc not found at $OPENFOAM_DIR/etc/bashrc"
    exit 1
fi

# Run the pipeline
python run_pipeline.py "$@"