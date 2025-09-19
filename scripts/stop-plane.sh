#!/bin/bash

echo "🛑 Stopping Plane Project..."
echo "================================"

# Stop all containers
docker compose -f docker-compose-local.yml down

echo "✅ All Plane services stopped!"
echo "================================"
echo "💡 To start again: ./start-plane.sh"

