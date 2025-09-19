#!/bin/bash

echo "🗄️  Running Database Migrations..."
echo "================================"

# Check if API container is running
if ! docker ps | grep -q plan-api-1; then
    echo "❌ API container is not running. Please start the project first."
    echo "💡 Run: ./scripts/start-plane.sh"
    exit 1
fi

# Run migrations
echo "🔄 Creating migrations..."
docker exec -it plan-api-1 python manage.py makemigrations

echo "🔄 Applying migrations..."
docker exec -it plan-api-1 python manage.py migrate

echo ""
echo "✅ Database Migrations Completed!"
echo "================================"
echo "💡 Database schema is now up to date."
