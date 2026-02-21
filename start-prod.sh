#!/bin/bash
# Start the Training Status application in production mode
# Builds frontend, serves everything from uvicorn on 0.0.0.0:8000

set -e

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "=== Training Status (prod) ==="

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

# Build frontend if needed
if [ ! -d "$PROJECT_ROOT/frontend/dist" ] || [ "$PROJECT_ROOT/frontend/src" -nt "$PROJECT_ROOT/frontend/dist" ]; then
    echo "Building frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install
    npm run build
fi

# Start the server
LAN_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================"
echo "Local:   http://localhost:8000"
echo "Network: http://${LAN_IP}:8000"
echo "========================================"
echo ""

cd "$PROJECT_ROOT/backend"
exec uvicorn training_status.api:app --host 0.0.0.0 --port 8000 --app-dir src
