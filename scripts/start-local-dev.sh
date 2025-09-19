#!/bin/bash

# Plane Local Development Setup Script
# This script starts the infrastructure services in Docker and runs the apps locally

set -e

echo "🚀 Starting Plane Local Development Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Start infrastructure services
print_status "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ, MinIO)..."
docker-compose -f docker-compose.local-services.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are healthy
print_status "Checking service health..."

# Check PostgreSQL
if nc -z localhost 5432; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if nc -z localhost 6379; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
    exit 1
fi

# Check RabbitMQ
if nc -z localhost 5672; then
    print_success "RabbitMQ is ready"
else
    print_error "RabbitMQ is not ready"
    exit 1
fi

# Check MinIO
if nc -z localhost 9000; then
    print_success "MinIO is ready"
else
    print_error "MinIO is not ready"
    exit 1
fi

print_success "All infrastructure services are ready!"

echo ""
echo "🎯 Infrastructure Services Status:"
echo "=================================="
echo "• PostgreSQL: http://localhost:5432"
echo "• Redis: localhost:6379"
echo "• RabbitMQ: http://localhost:15672 (admin/plane:plane)"
echo "• MinIO Console: http://localhost:9090 (plane:plane123)"
echo ""

echo "📝 Next Steps:"
echo "=============="
echo "1. Install Python dependencies and start API server:"
echo "   cd apps/api && python -m venv venv && source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo "   python manage.py migrate"
echo "   python manage.py runserver 8000"
echo ""
echo "2. Install Node.js dependencies (run from project root):"
echo "   yarn install"
echo ""
echo "3. Start frontend applications:"
echo "   yarn dev  # This will start all frontend apps with hot reload"
echo ""
echo "4. Access the applications:"
echo "   • Web App: http://localhost:3000"
echo "   • Admin App: http://localhost:3001" 
echo "   • Space App: http://localhost:3002"
echo "   • API: http://localhost:8000"
echo ""

print_warning "To stop infrastructure services later, run:"
print_warning "docker-compose -f docker-compose.local-services.yml down"

