#!/bin/bash

# Start Django API server locally
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Starting Django API Server"
echo "============================="

# Navigate to API directory
cd apps/api

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Run ./scripts/setup-api-local.sh first."
    exit 1
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

# Check if infrastructure services are running
print_status "Checking infrastructure services..."

if ! nc -z localhost 5432 2>/dev/null; then
    print_error "PostgreSQL is not running. Start infrastructure services first:"
    print_error "  ./scripts/start-local-dev.sh"
    exit 1
fi

if ! nc -z localhost 6379 2>/dev/null; then
    print_error "Redis is not running. Start infrastructure services first:"
    print_error "  ./scripts/start-local-dev.sh"
    exit 1
fi

print_success "Infrastructure services are ready"

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run migrations
print_status "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist (optional)
print_status "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('Creating superuser...')
    User.objects.create_superuser('admin', 'admin@plane.so', 'admin123')
    print('Superuser created: admin / admin123')
else:
    print('Superuser already exists')
" 2>/dev/null || true

# Start the development server
print_status "Starting Django development server on http://localhost:8000..."
print_status "Press Ctrl+C to stop the server"

echo ""
print_success "API Server is starting..."
echo "📍 API: http://localhost:8000"
echo "📍 Admin: http://localhost:8000/admin (admin / admin123)"
echo ""

# Start server with auto-reload
python manage.py runserver 0.0.0.0:8000

