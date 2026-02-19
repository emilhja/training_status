#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== Setting up Training Status ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Visit https://nodejs.org/ to install."
    exit 1
fi

echo "✅ Python 3: $(python3 --version)"
echo "✅ Node.js: $(node --version)"
echo ""

# Create data directory
echo "Setting up data directory..."
mkdir -p data
echo "✅ Data directory ready"
echo ""

# Setup backend
echo "=== Backend Setup ==="
cd backend

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Installing Python dependencies..."
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "Installing package in editable mode..."
pip install -q -e .

cd ..
echo "✅ Backend setup complete!"
echo ""

# Setup frontend
echo "=== Frontend Setup ==="
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "node_modules already exists, skipping npm install"
    echo "Run 'npm install' manually if you need to update dependencies"
fi

cd ..
echo "✅ Frontend setup complete!"
echo ""

# Environment file setup
if [ ! -f ".env" ]; then
    echo "=== Environment Setup ==="
    cp .env.example .env
    echo "✅ Created .env from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API credentials:"
    echo "   - INTERVALS_ID: Your athlete ID from Intervals.icu URL"
    echo "   - INTERVALS_API_KEY: From Intervals.icu → Settings"
    echo "   - SMASHRUN_TOKEN: From https://api.smashrun.com/explorer"
    echo ""
else
    echo "✅ .env already exists"
fi

echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo ""
echo "1. If you haven't already, edit .env with your credentials"
echo ""
echo "2. To run in development mode:"
echo "   Terminal 1: source backend/.venv/bin/activate && cd backend && uvicorn training_status.api:app --reload --port 8000 --app-dir src"
echo "   Terminal 2: cd frontend && npm run dev"
echo "   Then open http://localhost:5173"
echo ""
echo "3. To run in production mode:"
echo "   ./scripts/start.sh"
echo "   Then open http://localhost:8000"
echo ""
echo "4. To use CLI only:"
echo "   source backend/.venv/bin/activate && cd backend && python -m training_status.cli"
echo ""
