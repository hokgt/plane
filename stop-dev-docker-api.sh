#!/bin/bash

# Stop Plane Development Environment with Docker API

set -e

echo "🛑 Stopping Plane Development Environment (Docker API)..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Stop API server
print_status "Stopping API server..."
if docker ps | grep -q "plane-api-dev"; then
    docker stop plane-api-dev
    print_success "API server stopped"
else
    print_warning "API server was not running"
fi

# Stop frontend services
print_status "Stopping frontend services..."

# Stop Web Frontend
if [ -f "web.pid" ]; then
    pid=$(cat web.pid)
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping Web Frontend (PID: $pid)..."
        kill $pid 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
        fi
        print_success "Web Frontend stopped"
    else
        print_warning "Web Frontend was not running"
    fi
    rm -f web.pid
else
    print_warning "No PID file found for Web Frontend"
fi

# Stop Admin Frontend
if [ -f "admin.pid" ]; then
    pid=$(cat admin.pid)
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping Admin Frontend (PID: $pid)..."
        kill $pid 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
        fi
        print_success "Admin Frontend stopped"
    else
        print_warning "Admin Frontend was not running"
    fi
    rm -f admin.pid
else
    print_warning "No PID file found for Admin Frontend"
fi

# Stop Space Frontend
if [ -f "space.pid" ]; then
    pid=$(cat space.pid)
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping Space Frontend (PID: $pid)..."
        kill $pid 2>/dev/null || true
        sleep 2
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
        fi
        print_success "Space Frontend stopped"
    else
        print_warning "Space Frontend was not running"
    fi
    rm -f space.pid
else
    print_warning "No PID file found for Space Frontend"
fi

# Alternative: Kill any remaining Node processes
pkill -f "npm run dev" 2>/dev/null || true

# Stop database services
print_status "Stopping database services..."
docker-compose -f docker-compose.local-services.yml down

# Clean up log files
print_status "Cleaning up log files..."
rm -f web.log admin.log space.log

print_success "All services stopped successfully!"
echo ""
print_status "To start again, run: ./start-dev-docker-api.sh"
echo ""
