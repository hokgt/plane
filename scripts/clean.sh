#!/bin/bash

echo "🧹 Cleaning Plane Project..."
echo "================================"

echo "⚠️  This will remove all containers, volumes, and images."
read -p "Are you sure? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

# Stop and remove containers
echo "🛑 Stopping and removing containers..."
docker compose -f docker-compose-local.yml down -v

# Remove unused images
echo "🗑️  Removing unused images..."
docker image prune -f

# Remove unused volumes
echo "🗑️  Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "🗑️  Removing unused networks..."
docker network prune -f

echo ""
echo "✅ Cleanup Completed!"
echo "================================"
echo "💡 All containers, volumes, and unused images have been removed."
echo "🚀 Run ./scripts/start-plane.sh to start fresh."
