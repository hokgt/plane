#!/bin/bash

# Stop all local development services
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

echo "🛑 Stopping Plane Local Development Environment"
echo "==============================================="

# Stop Docker infrastructure services
print_status "Stopping infrastructure services..."
docker-compose -f docker-compose.local-services.yml down

print_success "Infrastructure services stopped"

# Kill any remaining processes on development ports
print_status "Cleaning up development processes..."

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        local pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | head -1)
        if [ ! -z "$pid" ]; then
            taskkill //PID $pid //F 2>/dev/null || true
            print_status "Stopped $service on port $port"
        fi
    else
        # Unix-like systems
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_status "Stopped $service on port $port"
        fi
    fi
}

# Kill development servers
kill_port 3000 "Web App"
kill_port 3001 "Admin App"
kill_port 3002 "Space App"
kill_port 3003 "Live Server"
kill_port 8000 "API Server"

print_success "All development services stopped"

echo ""
echo "✅ Local development environment has been stopped"
echo "   To restart, run: ./scripts/start-local-dev.sh"

