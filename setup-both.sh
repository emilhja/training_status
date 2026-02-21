#!/bin/bash
# Start both dev and prod servers simultaneously
# Dev:  backend :8000 + Vite :5173
# Prod: uvicorn :8080 (0.0.0.0, accessible from phone)

set -e

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "=== Training Status (dev + prod) ==="

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

# Build frontend for prod
echo "Building frontend for prod..."
cd "$PROJECT_ROOT/frontend"
npm run build

# Start dev backend
echo "Starting dev backend on http://localhost:8000"
cd "$PROJECT_ROOT/backend"
uvicorn training_status.api:app --reload --port 8000 --app-dir src &
DEV_BACKEND_PID=$!

# Start Vite dev server
echo "Starting Vite dev server on http://localhost:5173"
cd "$PROJECT_ROOT/frontend"
npm run dev &
VITE_PID=$!

# Start prod server on port 8080
echo "Starting prod server on http://0.0.0.0:8080"
cd "$PROJECT_ROOT/backend"
uvicorn training_status.api:app --host 0.0.0.0 --port 8080 --app-dir src &
PROD_PID=$!

LAN_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================="
echo " DEV"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo " PROD (phone testing)"
echo "   Local:    http://localhost:8080"
echo "   Network:  http://${LAN_IP}:8080"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Trap Ctrl+C to kill all processes
trap "echo ''; echo 'Stopping servers...'; kill $DEV_BACKEND_PID $VITE_PID $PROD_PID 2>/dev/null; exit 0" INT

# Wait for all processes
wait
