#!/bin/bash

echo "📊 Plane Project Status..."
echo "================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check container status
echo "🐳 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep plan

echo ""
echo "🌐 Service URLs:"
echo "Web App: http://localhost:3000"
echo "Admin Panel: http://localhost:3001"
echo "Space App: http://localhost:3002"
echo "API: http://localhost:8000"
echo "Database: localhost:5432"
echo "MinIO: http://localhost:9090"
echo "RabbitMQ: http://localhost:15672"

echo ""
echo "💾 Volume Usage:"
docker system df

echo ""
echo "🔧 Quick Commands:"
echo "• View logs: ./scripts/logs.sh"
echo "• Restart: ./scripts/restart-plane.sh"
echo "• Stop: ./scripts/stop-plane.sh"
