#!/bin/bash

echo "🗄️  Opening Database Shell..."
echo "================================"

# Check if database container is running
if ! docker ps | grep -q plan-plane-db-1; then
    echo "❌ Database container is not running. Please start the project first."
    echo "💡 Run: ./scripts/start-plane.sh"
    exit 1
fi

echo "🔗 Connecting to PostgreSQL database..."
echo "💡 Database: plane, User: plane, Password: plane"
echo "💡 Type '\\q' to exit"
echo ""

# Connect to database
docker exec -it plan-plane-db-1 psql -U plane -d plane
