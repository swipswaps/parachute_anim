#!/bin/bash

# Install dependencies for the frontend
echo "Installing frontend dependencies..."
cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend
npm install

# Install dependencies for the server
echo "Installing server dependencies..."
cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend/server
npm install

# Fix vulnerabilities
echo "Fixing vulnerabilities..."
npm audit fix

echo "Dependencies installed successfully!"
