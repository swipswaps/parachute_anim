#!/bin/bash

# Script to fix OpenFOAM configuration in .bashrc
# This script removes the problematic wildcard path

# Backup the original .bashrc file
cp ~/.bashrc ~/.bashrc.bak.$(date +%Y%m%d%H%M%S)

# Remove the problematic line
sed -i '/^source \/opt\/openfoam\*\/etc\/bashrc/d' ~/.bashrc

echo "Your .bashrc file has been updated to fix the OpenFOAM configuration."
echo "The original file was backed up as ~/.bashrc.bak.$(date +%Y%m%d%H%M%S)"
echo "Please restart your terminal or run 'source ~/.bashrc' to apply the changes."
