#!/bin/bash

# Backend Script to Check and Start Application
APP_DIR="/home/isakrabin/dev/ai4impact-R4131N/backend"
PORT=5000
PROCESS_NAME="backend-index.js"

# Function to check if the backend is running
check_backend_running() {
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "Backend is already running on port $PORT."
        return 0
    else
        echo "Backend is not running."
        return 1
    fi
}

# Function to start the backend application
start_backend() {
    echo "Starting Backend..."
    cd "$APP_DIR" || { echo "Backend directory not found"; exit 1; }
    nohup node backend-index.js > backend.log 2>&1 &
    echo "Backend started successfully!"
}

# Main Execution
check_backend_running || start_backend

