#!/bin/bash
# Start the Training Status application in development mode
# Backend (with hot reload) + Vite dev server

set -e

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "=== Training Status (dev) ==="

# Check if virtual environment exists, create if not
if [ ! -d "$PROJECT_ROOT/backend/.venv" ]; then
    echo "Creating Python virtual environment..."
    cd "$PROJECT_ROOT/backend"
    python3 -m venv .venv
fi

# Activate virtual environment
source "$PROJECT_ROOT/backend/.venv/bin/activate"

# Install/update dependencies
echo "Installing dependencies..."
pip install -q -r "$PROJECT_ROOT/requirements.txt"

# Install package in editable mode if not already installed
if ! python -c "import training_status" 2>/dev/null; then
    echo "Installing package in editable mode..."
    pip install -q -e "$PROJECT_ROOT/backend"
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend"
    npm install
fi

# Start backend in background
echo "Starting backend on http://localhost:8000"
cd "$PROJECT_ROOT/backend"
uvicorn training_status.api:app --reload --port 8000 --app-dir src &
BACKEND_PID=$!

# Start frontend in background
echo "Starting frontend on http://localhost:5173"
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for both processes
wait
