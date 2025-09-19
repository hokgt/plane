#!/bin/bash

echo "🔄 Restarting Frontend Services..."
echo "================================"

# Restart all frontend services
docker compose -f docker-compose-local.yml restart web space admin

echo "✅ Frontend Services Restarted!"
echo "================================"
echo "🌐 Web App: http://localhost:3000"
echo "🔧 Admin Panel: http://localhost:3001"
echo "🚀 Space App: http://localhost:3002"
echo ""
echo "💡 Frontend changes should now be active."
