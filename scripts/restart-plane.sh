#!/bin/bash

echo "🔄 Restarting Plane Project..."
echo "================================"

# Stop all containers
echo "🛑 Stopping services..."
docker compose -f docker-compose-local.yml down

# Start all services
echo "🚀 Starting services..."
docker compose -f docker-compose-local.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "📊 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep plan

echo ""
echo "✅ Plane Project Restarted!"
echo "================================"
echo "🌐 Web App: http://localhost:3000"
echo "🔧 Admin Panel: http://localhost:3001"
echo "🚀 Space App: http://localhost:3002"
echo "📡 API: http://localhost:8000"
echo ""
echo "💡 Frontend apps are rebuilding... This may take a few minutes."
