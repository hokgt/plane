# 🚀 Plane Project Scripts

This folder contains all the shell scripts for managing the Plane project development environment. These scripts provide easy-to-use commands for common development tasks.

## 📋 Available Scripts

### 🏃‍♂️ Core Management Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `start-plane.sh` | Start all Plane services | `./scripts/start-plane.sh` |
| `stop-plane.sh` | Stop all Plane services | `./scripts/stop-plane.sh` |
| `restart-plane.sh` | Restart all services | `./scripts/restart-plane.sh` |
| `rebuild-plane.sh` | Rebuild and start all services | `./scripts/rebuild-plane.sh` |

### 🔄 Service-Specific Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `restart-api.sh` | Restart only the API service | `./scripts/restart-api.sh` |
| `restart-web.sh` | Restart only the Web service | `./scripts/restart-web.sh` |
| `restart-frontend.sh` | Restart all frontend services (web, space, admin) | `./scripts/restart-frontend.sh` |

### 🗄️ Database Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `migrate-db.sh` | Run database migrations | `./scripts/migrate-db.sh` |
| `db-shell.sh` | Open PostgreSQL shell | `./scripts/db-shell.sh` |

### 👤 User Management Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `create-admin.sh` | Create a new admin user | `./scripts/create-admin.sh` |

### 🔧 Development Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `api-shell.sh` | Open Django shell | `./scripts/api-shell.sh` |
| `logs.sh` | View service logs | `./scripts/logs.sh` |
| `status.sh` | Check project status | `./scripts/status.sh` |
| `clean.sh` | Clean up containers and volumes | `./scripts/clean.sh` |

## 🚀 Quick Start

### First Time Setup
```bash
# Start the project for the first time
./scripts/start-plane.sh

# Wait for services to start (5-10 minutes)
# Then create an admin user
./scripts/create-admin.sh
```

### Daily Development Workflow
```bash
# Check project status
./scripts/status.sh

# Make code changes, then restart specific services
./scripts/restart-api.sh    # For backend changes
./scripts/restart-web.sh    # For frontend changes

# View logs if needed
./scripts/logs.sh
```

## 📖 Detailed Usage

### 🏃‍♂️ Core Management

#### `start-plane.sh`
Starts all Plane services in Docker containers.
- Creates `.env` file if it doesn't exist
- Stops any existing containers
- Starts all services in detached mode
- Shows service status and URLs

**When to use**: First time setup or after a complete shutdown.

#### `stop-plane.sh`
Stops all Plane services and removes containers.
- Gracefully stops all containers
- Removes containers and networks
- Preserves volumes (data is kept)

**When to use**: When you want to stop all services.

#### `restart-plane.sh`
Quick restart of all services without rebuilding.
- Stops all containers
- Starts all services again
- Faster than full rebuild

**When to use**: When you want to restart everything quickly.

#### `rebuild-plane.sh`
Full rebuild and restart of all services.
- Stops all containers
- Rebuilds all Docker images
- Starts all services
- Takes longer but ensures all changes are applied

**When to use**: After major changes, dependency updates, or when things seem broken.

### 🔄 Service-Specific Restarts

#### `restart-api.sh`
Restarts only the API service (Django backend).
- Fast restart for backend changes
- Preserves other services

**When to use**: After making changes to Python/Django code.

#### `restart-web.sh`
Restarts only the Web service (Next.js frontend).
- Fast restart for frontend changes
- Preserves other services

**When to use**: After making changes to React/Next.js code.

#### `restart-frontend.sh`
Restarts all frontend services (web, space, admin).
- Restarts all UI applications
- Preserves backend services

**When to use**: After making changes to shared frontend code or UI components.

### 🗄️ Database Operations

#### `migrate-db.sh`
Runs Django database migrations.
- Creates new migrations if needed
- Applies pending migrations
- Updates database schema

**When to use**: After making changes to Django models.

#### `db-shell.sh`
Opens a PostgreSQL shell for direct database access.
- Connects to the Plane database
- Allows SQL queries and database inspection

**When to use**: For debugging, data inspection, or manual database operations.

### 👤 User Management

#### `create-admin.sh`
Creates a new admin user interactively.
- Prompts for user details
- Creates user with admin privileges
- Sets up authentication

**When to use**: When you need to create a new admin account.

### 🔧 Development Tools

#### `api-shell.sh`
Opens a Django shell for Python development.
- Interactive Python environment
- Access to Django models and utilities
- Useful for testing and debugging

**When to use**: For testing Python code, debugging, or data manipulation.

#### `logs.sh`
Interactive log viewer for all services.
- Shows real-time logs
- Allows filtering by service
- Useful for debugging

**When to use**: When you need to debug issues or monitor service behavior.

#### `status.sh`
Shows comprehensive project status.
- Container status
- Service URLs
- Volume usage
- Quick command reference

**When to use**: To check if everything is running properly.

#### `clean.sh`
Cleans up Docker resources.
- Removes all containers and volumes
- Removes unused images and networks
- Frees up disk space

**When to use**: When you want to start completely fresh or free up disk space.

## 🌐 Service URLs

After starting the project, these services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Main Plane application |
| Admin Panel | http://localhost:3001 | Admin interface |
| Space App | http://localhost:3002 | Space management |
| API | http://localhost:8000 | Backend API |
| Database | localhost:5432 | PostgreSQL database |
| MinIO | http://localhost:9090 | File storage |
| RabbitMQ | http://localhost:15672 | Message queue |

## 🔧 Development Tips

### Code Changes
- **Frontend changes**: Use `restart-web.sh` or `restart-frontend.sh`
- **Backend changes**: Use `restart-api.sh`
- **Database changes**: Use `migrate-db.sh` after model changes
- **Major changes**: Use `rebuild-plane.sh`

### Debugging
- **View logs**: Use `logs.sh` to see real-time logs
- **Check status**: Use `status.sh` to verify everything is running
- **Database access**: Use `db-shell.sh` for direct database queries
- **API debugging**: Use `api-shell.sh` for Python/Django debugging

### Performance
- **Quick restarts**: Use service-specific restart scripts
- **Full rebuild**: Use `rebuild-plane.sh` when needed
- **Cleanup**: Use `clean.sh` to free up disk space

## 🚨 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check Docker is running
docker info

# Check project status
./scripts/status.sh

# Try a full rebuild
./scripts/rebuild-plane.sh
```

#### Database connection issues
```bash
# Check database container
docker ps | grep plane-db

# Test database connection
./scripts/db-shell.sh
```

#### Frontend not updating
```bash
# Restart frontend services
./scripts/restart-frontend.sh

# Or rebuild everything
./scripts/rebuild-plane.sh
```

#### Out of disk space
```bash
# Clean up Docker resources
./scripts/clean.sh

# Check disk usage
docker system df
```

### Getting Help
- Check logs: `./scripts/logs.sh`
- Check status: `./scripts/status.sh`
- View this documentation: `cat scripts/README.md`

## 📝 Notes

- All scripts are designed to be run from the project root directory
- Scripts automatically check for required dependencies (Docker, containers)
- Most scripts provide helpful error messages and suggestions
- Scripts preserve data volumes unless explicitly cleaned
- The project uses Docker for all services, so no local database installation is needed

## 🔄 Workflow Examples

### Daily Development
```bash
# Start your day
./scripts/status.sh

# Make changes to frontend
# ... edit code ...
./scripts/restart-web.sh

# Make changes to backend
# ... edit code ...
./scripts/restart-api.sh

# Check logs if needed
./scripts/logs.sh
```

### After Major Changes
```bash
# Stop everything
./scripts/stop-plane.sh

# Rebuild and start
./scripts/rebuild-plane.sh

# Run migrations if needed
./scripts/migrate-db.sh
```

### Debugging Session
```bash
# Check what's running
./scripts/status.sh

# View logs
./scripts/logs.sh

# Access database
./scripts/db-shell.sh

# Access API shell
./scripts/api-shell.sh
```

---

**Happy coding! 🚀**
