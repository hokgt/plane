#!/bin/bash

echo "🔨 Rebuilding Plane Project..."
echo "================================"

# Stop all containers
echo "🛑 Stopping services..."
docker compose -f docker-compose-local.yml down

# Rebuild and start all services
echo "🔨 Rebuilding and starting services..."
docker compose -f docker-compose-local.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check status
echo "📊 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep plan

echo ""
echo "✅ Plane Project Rebuilt and Started!"
echo "================================"
echo "🌐 Web App: http://localhost:3000"
echo "🔧 Admin Panel: http://localhost:3001"
echo "🚀 Space App: http://localhost:3002"
echo "📡 API: http://localhost:8000"
echo ""
echo "⏳ Frontend apps are building... This may take 5-10 minutes."
echo "💡 Check http://localhost:3000 in a few minutes to access the app."
