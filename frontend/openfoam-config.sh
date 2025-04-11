#!/bin/bash

# OpenFOAM Configuration Script
# This script properly configures the environment for OpenFOAM

# Define a function to find the OpenFOAM bashrc file
find_openfoam_bashrc() {
    # First, check the specific path
    if [ -f /opt/OpenFOAM-10/etc/bashrc ]; then
        echo "/opt/OpenFOAM-10/etc/bashrc"
        return 0
    fi

    # If not found, search for any OpenFOAM installation
    local bashrc_path=$(find /opt -maxdepth 3 -path "*/OpenFOAM*/etc/bashrc" 2>/dev/null | head -n 1)
    if [ -n "$bashrc_path" ] && [ -f "$bashrc_path" ]; then
        echo "$bashrc_path"
        return 0
    fi

    # If still not found, try a case-insensitive search
    local bashrc_path=$(find /opt -maxdepth 3 -ipath "*/openfoam*/etc/bashrc" 2>/dev/null | head -n 1)
    if [ -n "$bashrc_path" ] && [ -f "$bashrc_path" ]; then
        echo "$bashrc_path"
        return 0
    fi

    # Not found
    return 1
}

# Find the OpenFOAM bashrc file
OPENFOAM_BASHRC=$(find_openfoam_bashrc)

# Source the OpenFOAM bashrc file if found
if [ -n "$OPENFOAM_BASHRC" ]; then
    echo "[+] Loading OpenFOAM from $OPENFOAM_BASHRC"
    source "$OPENFOAM_BASHRC"

    # Print OpenFOAM version
    if [ -n "$WM_PROJECT_VERSION" ]; then
        echo "[+] OpenFOAM version: $WM_PROJECT_VERSION"
    else
        echo "[!] OpenFOAM version not found"
    fi
else
    echo "[!] OpenFOAM environment not found"
    echo "[!] Please install OpenFOAM or update the path"
    exit 1
fi

# Run the command passed to this script
exec "$@"
