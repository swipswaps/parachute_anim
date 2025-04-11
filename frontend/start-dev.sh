#!/bin/bash

# Start the development server
cd server && npm install && npm run dev &
SERVER_PID=$!

# Start the frontend
npm run dev &
FRONTEND_PID=$!

# Function to handle exit
function cleanup {
  echo "Stopping servers..."
  kill $SERVER_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Wait for both processes
wait $SERVER_PID $FRONTEND_PID
