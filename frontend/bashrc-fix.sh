#!/bin/bash

# Script to fix OpenFOAM configuration in .bashrc
# This script removes the problematic wildcard path and ensures a robust method is used

# Backup the original .bashrc file
cp ~/.bashrc ~/.bashrc.bak.$(date +%Y%m%d%H%M%S)

# Remove the problematic line
sed -i '/^source \/opt\/openfoam\*\/etc\/bashrc/d' ~/.bashrc

# Check if the robust method is already present
if ! grep -q "OPENFOAM_BASHRC=\$(find /opt -maxdepth 3 -path" ~/.bashrc; then
    # Add the robust method if not present
    cat >> ~/.bashrc << 'EOF'

# 🔧 OpenFOAM Configuration (Fixed)
OPENFOAM_BASHRC=$(find /opt -maxdepth 3 -ipath "*/openfoam*/etc/bashrc" 2>/dev/null | head -n 1)
if [ -n "$OPENFOAM_BASHRC" ] && [ -f "$OPENFOAM_BASHRC" ]; then
  echo "[+] Loading OpenFOAM from $OPENFOAM_BASHRC"
  source "$OPENFOAM_BASHRC"
else
  echo "[!] OpenFOAM environment not found in /opt"
fi
EOF
fi

echo "Your .bashrc file has been updated to fix the OpenFOAM configuration."
echo "The original file was backed up as ~/.bashrc.bak.$(date +%Y%m%d%H%M%S)"
echo "Please restart your terminal or run 'source ~/.bashrc' to apply the changes."
