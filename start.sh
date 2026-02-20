#!/bin/bash
# Start the Training Status application

set -e

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Parse arguments
DEV_MODE=false
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
    DEV_MODE=true
fi

echo "=== Training Status ==="

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

if [ "$DEV_MODE" = true ]; then
    # Development mode - start both backend and frontend separately
    echo ""
    echo "=== Development Mode ==="
    echo "Starting backend and frontend in separate processes..."
    echo ""

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
else
    # Production mode - build frontend and serve from backend
    if [ ! -d "$PROJECT_ROOT/frontend/dist" ] || [ "$PROJECT_ROOT/frontend/src" -nt "$PROJECT_ROOT/frontend/dist" ]; then
        echo "Building frontend..."
        cd "$PROJECT_ROOT/frontend"
        npm install
        npm run build
    fi

    # Start the server
    echo "Starting server on http://localhost:8000"
    cd "$PROJECT_ROOT/backend"
    exec uvicorn training_status.api:app --host 0.0.0.0 --port 8000 --app-dir src
fi
