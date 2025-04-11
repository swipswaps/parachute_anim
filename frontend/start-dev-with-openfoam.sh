#!/bin/bash

# Start the development server with OpenFOAM configuration
cd "$(dirname "$0")"
./openfoam-config.sh npm run dev
