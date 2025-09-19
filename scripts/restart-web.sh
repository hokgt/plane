#!/bin/bash

echo "🔄 Restarting Web Service..."
echo "================================"

# Restart web service
docker compose -f docker-compose-local.yml restart web

echo "✅ Web Service Restarted!"
echo "================================"
echo "🌐 Web App: http://localhost:3000"
echo ""
echo "💡 Frontend changes should now be active."
