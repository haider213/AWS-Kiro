#!/bin/bash

# Quick Start Script for RAG Pipeline Educator
# Simple version that starts both services quickly

echo "🚀 Starting RAG Pipeline Educator..."

# Kill any existing processes on our ports
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Start Python backend
echo "🐍 Starting Python backend..."
cd python_backend
source venv_clean/bin/activate && python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️ Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ RAG Pipeline Educator is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🐍 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "npm.*dev" 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM EXIT

# Wait for user interrupt
wait