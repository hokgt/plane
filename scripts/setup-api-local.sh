#!/bin/bash

# Setup script for running Django API locally
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🐍 Setting up Django API for Local Development"
echo "=============================================="

# Navigate to API directory
cd apps/api

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

print_status "Using Python: $($PYTHON_CMD --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    print_success "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows Git Bash
    source venv/Scripts/activate
else
    # Unix-like systems
    source venv/bin/activate
fi

# Upgrade pip
print_status "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
print_status "Installing Python dependencies..."
pip install -r requirements.txt

print_success "Django API setup completed!"

echo ""
echo "🚀 To start the API server:"
echo "=========================="
echo "1. Make sure infrastructure services are running:"
echo "   ./scripts/start-local-dev.sh"
echo ""
echo "2. Activate the virtual environment and start the server:"
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "   cd apps/api && source venv/Scripts/activate"
else
    echo "   cd apps/api && source venv/bin/activate"
fi
echo "   python manage.py migrate"
echo "   python manage.py runserver 8000"
echo ""
echo "📍 API will be available at: http://localhost:8000"

