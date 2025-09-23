#!/bin/bash

# Start Plane Development Environment with Docker API
# This script starts database services in Docker and API in Docker, but frontends locally

set -e

echo "🚀 Starting Plane Development Environment (Docker API)..."
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
print_status "Starting database services (PostgreSQL, Redis, MinIO, RabbitMQ)..."
docker-compose -f docker-compose.local-services.yml up -d
sleep 5

# Check if database services are running
if docker ps | grep -q "plane-db"; then
    print_success "Database services started successfully"
else
    print_error "Failed to start database services"
    exit 1
fi

# Start API server in Docker
print_status "Starting Plane API server in Docker..."
docker-compose run --rm -d -p 8000:8000 \
    -e DATABASE_URL="postgresql://plane:plane@plane-db:5432/plane" \
    -e REDIS_URL="redis://plane-redis:6379/0" \
    -e RABBITMQ_HOST="plane-mq" \
    -e RABBITMQ_PORT="5672" \
    -e RABBITMQ_USER="plane" \
    -e RABBITMQ_PASSWORD="plane" \
    -e RABBITMQ_VHOST="plane" \
    -e AMQP_URL="amqp://plane:plane@plane-mq:5672/plane" \
    -e EMAIL_HOST="smtp.gmail.com" \
    -e EMAIL_HOST_USER="your-email@gmail.com" \
    -e EMAIL_HOST_PASSWORD="your-app-password" \
    -e EMAIL_PORT="587" \
    -e EMAIL_USE_TLS="1" \
    -e EMAIL_USE_SSL="0" \
    -e EMAIL_FROM="Plane Team <noreply@plane.so>" \
    -e ENABLE_MAGIC_LINK_LOGIN="0" \
    -e DJANGO_SETTINGS_MODULE="plane.settings.production" \
    --name plane-api-dev \
    api python manage.py runserver 0.0.0.0:8000

# Connect API container to dev_env network for RabbitMQ access
print_status "Connecting API container to dev_env network..."
docker network connect plan_dev_env plane-api-dev

# Wait for API to start
print_status "Waiting for API server to start..."
sleep 10

# Check if API is running
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    print_success "API server started successfully at http://localhost:8000"
else
    print_warning "API server might still be starting. Check logs: docker logs plane-api-dev"
fi

# Start frontend services
print_status "Starting Web frontend..."
cd apps/web
npm run dev > ../../web.log 2>&1 &
echo $! > ../../web.pid
cd ../..

print_status "Starting Space frontend..."
cd apps/space
npm run dev > ../../space.log 2>&1 &
echo $! > ../../space.pid
cd ../..

print_status "Starting Admin frontend..."
cd apps/admin
npm run dev > ../../admin.log 2>&1 &
echo $! > ../../admin.pid
cd ../..

# Wait for frontends to start
print_status "Waiting for frontends to start..."
sleep 10

echo ""
echo "🎉 Plane Development Environment Started Successfully!"
echo "======================================================="
echo ""
print_success "Services running:"
echo "  🗄️  Database Services: PostgreSQL, Redis, MinIO, RabbitMQ (Docker)"
echo "  🔧 API Server:        http://localhost:8000 (Docker)"
echo "  🌐 Web Frontend:      http://localhost:3000 (Local)"
echo "  👨‍💼 Admin Frontend:    http://localhost:3001 (Local)"
echo "  🚀 Space Frontend:    http://localhost:4000 (Local)"
echo ""
print_status "Logs available:"
echo "  API:   docker logs -f plane-api-dev"
echo "  Web:   tail -f web.log"
echo "  Admin: tail -f admin.log"
echo "  Space: tail -f space.log"
echo ""
print_status "To stop:"
echo "  ./stop-dev-docker-api.sh"
echo ""
print_success "Happy coding! 🚀"
