#!/bin/bash

echo "🐍 Opening API Shell..."
echo "================================"

# Check if API container is running
if ! docker ps | grep -q plan-api-1; then
    echo "❌ API container is not running. Please start the project first."
    echo "💡 Run: ./scripts/start-plane.sh"
    exit 1
fi

echo "🔗 Opening Django shell..."
echo "💡 Type 'exit()' to exit"
echo ""

# Open Django shell
docker exec -it plan-api-1 python manage.py shell
