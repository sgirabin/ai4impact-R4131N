#!/bin/bash

# Frontend Script to Check and Start Application
APP_DIR="/home/isakrabin/dev/ai4impact-R4131N/frontend"
PORT=3000

# Function to check if the frontend is running
check_frontend_running() {
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "Frontend is already running on port $PORT."
        return 0
    else
        echo "Frontend is not running."
        return 1
    fi
}

# Function to start the frontend application
start_frontend() {
    echo "Starting Frontend..."
    cd "$APP_DIR" || { echo "Frontend directory not found"; exit 1; }
    nohup npm start > frontend.log 2>&1 &
    echo "Frontend started successfully!"
}

# Main Execution
check_frontend_running || start_frontend

