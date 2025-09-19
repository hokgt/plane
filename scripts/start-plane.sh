#!/bin/bash

echo "🚀 Starting Plane Project..."
echo "================================"

# Check if .env file exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_DB=plane
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=plane
RABBITMQ_VHOST=plane
AWS_ACCESS_KEY_ID=plane
AWS_SECRET_ACCESS_KEY=plane123
AWS_S3_BUCKET_NAME=uploads
EOF
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose-local.yml down

# Start all services
echo "🐳 Starting all services..."
docker compose -f docker-compose-local.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "📊 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep plan

echo ""
echo "✅ Plane Project Started!"
echo "================================"
echo "🌐 Web App: http://localhost:3000"
echo "🔧 Admin Panel: http://localhost:3001"
echo "🚀 Space App: http://localhost:3002"
echo "📡 API: http://localhost:8000"
echo "🗄️  Database: localhost:5432 (user: plane, pass: plane, db: plane)"
echo "📦 MinIO: http://localhost:9090 (user: plane, pass: plane123)"
echo "🐰 RabbitMQ: http://localhost:15672 (user: plane, pass: plane)"
echo ""
echo "⏳ Frontend apps are building... This may take 5-10 minutes on first run."
echo "💡 Check http://localhost:3000 in a few minutes to access the app."
echo ""
echo "🛑 To stop: ./stop-plane.sh"

