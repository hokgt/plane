#!/bin/bash

# Start all frontend applications locally with hot reload
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

echo "🌐 Starting Frontend Applications"
echo "================================="

# Check if Node.js and yarn are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    print_error "Yarn is not installed. Please install Yarn first."
    exit 1
fi

print_status "Using Node.js: $(node --version)"
print_status "Using Yarn: $(yarn --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    yarn install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if API is running
if nc -z localhost 8000 2>/dev/null; then
    print_success "API server is running on http://localhost:8000"
else
    print_warning "API server is not running. Start it with: ./scripts/start-api-local.sh"
fi

# Start all frontend applications using Turbo
print_status "Starting all frontend applications with hot reload..."
print_status "This will start:"
echo "  • Web App: http://localhost:3000"
echo "  • Admin App: http://localhost:3001"
echo "  • Space App: http://localhost:3002"
echo "  • Live Server: http://localhost:3003"
echo ""
print_status "Press Ctrl+C to stop all applications"
echo ""

# Start development servers
yarn dev

