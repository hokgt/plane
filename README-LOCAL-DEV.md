# Plane Local Development Setup

This guide helps you set up Plane for local development with fast refresh and hot reloading for frontend applications, while keeping backend services (database, cache, etc.) in Docker containers.

## 🏗️ Architecture

- **Frontend Apps** (runs locally with hot reload):
  - Web App (Next.js) - Port 3000
  - Admin App (Next.js) - Port 3001
  - Space App (Next.js) - Port 3002
  - Live Server (Node.js) - Port 3003

- **Backend Services** (runs in Docker):
  - PostgreSQL Database - Port 5432
  - Redis Cache - Port 6379
  - RabbitMQ Message Queue - Port 5672, Management UI: 15672
  - MinIO S3 Storage - Port 9000, Console: 9090

- **API Server** (runs locally with auto-reload):
  - Django API - Port 8000

## 🚀 Quick Start

### 1. Start Infrastructure Services

```bash
./scripts/start-local-dev.sh
```

This will:
- Start PostgreSQL, Redis, RabbitMQ, and MinIO in Docker containers
- Check service health
- Display connection information

### 2. Setup and Start API Server

First time setup:
```bash
./scripts/setup-api-local.sh
```

Start the API server:
```bash
./scripts/start-api-local.sh
```

This will:
- Activate Python virtual environment
- Run database migrations
- Create a superuser (admin/admin123)
- Start Django development server with auto-reload

### 3. Start Frontend Applications

```bash
./scripts/start-frontend-local.sh
```

This will:
- Install Node.js dependencies if needed
- Start all frontend apps with hot reload using Turbo

## 🔗 Application URLs

- **Web App**: http://localhost:3000
- **Admin App**: http://localhost:3001
- **Space App**: http://localhost:3002
- **Live Server**: http://localhost:3003
- **API Server**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin (admin/admin123)

## 🛠️ Infrastructure Services

- **PostgreSQL**: localhost:5432 (plane/plane/plane)
- **Redis**: localhost:6379
- **RabbitMQ Management**: http://localhost:15672 (plane/plane)
- **MinIO Console**: http://localhost:9090 (plane/plane123)

## 🛑 Stopping Services

To stop all services:
```bash
./scripts/stop-local-dev.sh
```

To stop only infrastructure services:
```bash
docker-compose -f docker-compose.local-services.yml down
```

## 📝 Manual Setup (Alternative)

If you prefer manual setup:

### Infrastructure Services
```bash
docker-compose -f docker-compose.local-services.yml up -d
```

### API Server
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # or venv/Scripts/activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### Frontend Applications
```bash
yarn install
yarn dev
```

## 🔧 Configuration

### Environment Files

- `appsapi.env` - API server configuration (already configured for local development)
- `appsweb.env` - Web app configuration
- `appsadmin.env` - Admin app configuration
- `appsspace.env` - Space app configuration
- `appslive.env` - Live server configuration

### Database

The setup uses PostgreSQL in Docker with the following credentials:
- Host: localhost:5432
- Database: plane
- User: plane
- Password: plane

### Development Features

- **Hot Reload**: All frontend applications support hot reload for fast development
- **Auto-reload**: Django API server automatically reloads on code changes
- **Debug Mode**: Django runs in debug mode with detailed error pages
- **Live Collaboration**: Real-time collaborative editing through the Live server

## 🐛 Troubleshooting

### Services Not Starting

1. Check if Docker is running: `docker info`
2. Check port availability: `netstat -an | grep :5432`
3. Check service logs: `docker-compose -f docker-compose.local-services.yml logs`

### API Connection Issues

1. Verify infrastructure services are running: `./scripts/start-local-dev.sh`
2. Check API server logs for database connection errors
3. Ensure environment variables in `appsapi.env` are correct

### Frontend Build Issues

1. Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
2. Clear Next.js cache: `yarn clean`
3. Check Node.js version compatibility

### Database Issues

1. Reset database: `docker-compose -f docker-compose.local-services.yml down -v`
2. Start fresh: `./scripts/start-local-dev.sh`
3. Re-run migrations: `cd apps/api && python manage.py migrate`

## 💡 Tips

- Use multiple terminal windows/tabs for different services
- Monitor logs in separate terminals for debugging
- Frontend changes reflect immediately with hot reload
- API changes require server restart (handled automatically)
- Database schema changes require running migrations

## 🔄 Development Workflow

1. Start infrastructure: `./scripts/start-local-dev.sh`
2. Start API in one terminal: `./scripts/start-api-local.sh`
3. Start frontend in another terminal: `./scripts/start-frontend-local.sh`
4. Make changes and see them reflected immediately
5. Stop everything: `./scripts/stop-local-dev.sh`

