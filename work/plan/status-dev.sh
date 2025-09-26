#!/bin/bash

# Plane Development Status Script
# Check the status of all development services

echo "📊 Plane Development Environment Status"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "  ✅ $name: ${GREEN}Running${NC} ($url)"
    else
        echo -e "  ❌ $name: ${RED}Not Running${NC} ($url)"
    fi
}

check_docker_service() {
    local container=$1
    local name=$2
    
    if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
        echo -e "  ✅ $name: ${GREEN}Running${NC}"
    else
        echo -e "  ❌ $name: ${RED}Not Running${NC}"
    fi
}

echo ""
print_status "Database Services:"
check_docker_service "plane-db" "PostgreSQL"
check_docker_service "plane-redis" "Redis"
check_docker_service "plane-minio" "MinIO"
check_docker_service "plane-mq" "RabbitMQ"

echo ""
print_status "Application Services:"
check_service "http://localhost:8000/" "API Server"
check_service "http://localhost:3000/" "Web Frontend"
check_service "http://localhost:3001/" "Admin Frontend"
check_service "http://localhost:4000/" "Space Frontend"

echo ""
print_status "Process Information:"

# Check for running processes
if pgrep -f "manage.py runserver" > /dev/null; then
    echo -e "  ✅ Django API: ${GREEN}Running${NC} (PID: $(pgrep -f 'manage.py runserver'))"
else
    echo -e "  ❌ Django API: ${RED}Not Running${NC}"
fi

if pgrep -f "npm run dev" > /dev/null; then
    echo -e "  ✅ Frontend Services: ${GREEN}Running${NC} (PIDs: $(pgrep -f 'npm run dev' | tr '\n' ' '))"
else
    echo -e "  ❌ Frontend Services: ${RED}Not Running${NC}"
fi

echo ""
print_status "Log Files:"
for log in apps/api.log apps/web.log apps/admin.log apps/space.log; do
    if [ -f "$log" ]; then
        echo -e "  📄 $log: ${GREEN}Available${NC} ($(wc -l < "$log") lines)"
    else
        echo -e "  📄 $log: ${RED}Not Found${NC}"
    fi
done

echo ""
print_status "Quick Commands:"
echo "  Start All:  ./start-dev.sh"
echo "  Stop All:   ./stop-dev.sh"
echo "  View Logs:  tail -f apps/api.log"
echo ""
