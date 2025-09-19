#!/bin/bash

echo "📋 Plane Project Logs..."
echo "================================"

# Check if any containers are running
if ! docker ps | grep -q plan; then
    echo "❌ No Plane containers are running."
    echo "💡 Run: ./scripts/start-plane.sh"
    exit 1
fi

echo "📊 Available services:"
echo "1. All services"
echo "2. API only"
echo "3. Web only"
echo "4. Database only"
echo "5. Worker only"
echo ""

read -p "Select service (1-5): " choice

case $choice in
    1)
        echo "📋 Showing logs for all services..."
        docker compose -f docker-compose-local.yml logs -f
        ;;
    2)
        echo "📋 Showing API logs..."
        docker compose -f docker-compose-local.yml logs -f api
        ;;
    3)
        echo "📋 Showing Web logs..."
        docker compose -f docker-compose-local.yml logs -f web
        ;;
    4)
        echo "📋 Showing Database logs..."
        docker compose -f docker-compose-local.yml logs -f plane-db
        ;;
    5)
        echo "📋 Showing Worker logs..."
        docker compose -f docker-compose-local.yml logs -f worker
        ;;
    *)
        echo "❌ Invalid choice. Showing all logs..."
        docker compose -f docker-compose-local.yml logs -f
        ;;
esac
