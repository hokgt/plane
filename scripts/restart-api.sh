#!/bin/bash

echo "🔄 Restarting API Service..."
echo "================================"

# Restart API service
docker compose -f docker-compose-local.yml restart api

echo "✅ API Service Restarted!"
echo "================================"
echo "📡 API: http://localhost:8000"
echo ""
echo "💡 API changes should now be active."
