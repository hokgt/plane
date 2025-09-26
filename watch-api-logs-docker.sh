#!/bin/bash

# Watch API logs for Docker API setup
# This script provides advanced log watching capabilities for the Docker API server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}    Plane API Log Watcher (Docker)${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -e, --errors   Show only error logs"
    echo "  -w, --warnings Show only warning and error logs"
    echo "  -d, --debug    Show debug logs"
    echo "  -a, --all      Show all logs (API + Frontends)"
    echo "  -f, --follow   Follow logs in real-time (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Follow all API logs"
    echo "  $0 --errors          # Show only errors"
    echo "  $0 --all             # Show API + all frontend logs"
    echo "  $0 --debug           # Show debug information"
}

# Default options
SHOW_ERRORS_ONLY=false
SHOW_WARNINGS=false
SHOW_DEBUG=false
SHOW_ALL=false
FOLLOW=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_help
            exit 0
            ;;
        -e|--errors)
            SHOW_ERRORS_ONLY=true
            shift
            ;;
        -w|--warnings)
            SHOW_WARNINGS=true
            shift
            ;;
        -d|--debug)
            SHOW_DEBUG=true
            shift
            ;;
        -a|--all)
            SHOW_ALL=true
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            print_help
            exit 1
            ;;
    esac
done

print_header

# Check if API container is running
if ! docker ps | grep -q "plane-api-dev"; then
    echo -e "${RED}[ERROR]${NC} API container 'plane-api-dev' is not running!"
    echo "Start the API server first with: ./start-dev-docker-api.sh"
    exit 1
fi

echo -e "${BLUE}[INFO]${NC} Following API logs..."
echo -e "${BLUE}[INFO]${NC} Press Ctrl+C to stop"
echo ""

# Build the docker logs command
DOCKER_CMD="docker logs -f plane-api-dev"

# Add filtering if requested
if [ "$SHOW_ERRORS_ONLY" = true ]; then
    DOCKER_CMD="$DOCKER_CMD 2>&1 | grep -i 'error\\|exception\\|traceback\\|fatal'"
elif [ "$SHOW_WARNINGS" = true ]; then
    DOCKER_CMD="$DOCKER_CMD 2>&1 | grep -i 'warning\\|error\\|exception\\|traceback\\|fatal'"
elif [ "$SHOW_DEBUG" = true ]; then
    DOCKER_CMD="$DOCKER_CMD 2>&1 | grep -i 'debug\\|info\\|warning\\|error'"
fi

# Execute the command
if [ "$SHOW_ALL" = true ]; then
    echo -e "${BLUE}[INFO]${NC} Showing all logs (API + Frontends)..."
    echo ""
    
    # Show API logs
    echo -e "${GREEN}=== API LOGS ===${NC}"
    $DOCKER_CMD &
    API_PID=$!
    
    # Show frontend logs if they exist
    if [ -f "web.log" ]; then
        echo -e "${GREEN}=== WEB FRONTEND LOGS ===${NC}"
        tail -f web.log &
        WEB_PID=$!
    fi
    
    if [ -f "admin.log" ]; then
        echo -e "${GREEN}=== ADMIN FRONTEND LOGS ===${NC}"
        tail -f admin.log &
        ADMIN_PID=$!
    fi
    
    if [ -f "space.log" ]; then
        echo -e "${GREEN}=== SPACE FRONTEND LOGS ===${NC}"
        tail -f space.log &
        SPACE_PID=$!
    fi
    
    # Wait for user to stop
    wait
    
    # Clean up background processes
    kill $API_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    kill $ADMIN_PID 2>/dev/null || true
    kill $SPACE_PID 2>/dev/null || true
else
    # Just show API logs
    eval $DOCKER_CMD
fi
