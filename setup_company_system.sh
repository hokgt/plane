#!/bin/bash

# Setup Company Management System for Plane
# This script helps you set up companies and users

set -e

echo "🏢 Setting up Company Management System for Plane"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "apps/api/manage.py" ]; then
    print_error "Please run this script from the Plane root directory"
    exit 1
fi

# Check if API is running
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    print_warning "API server is not running. Starting it..."
    ./start-dev-docker-api.sh
    sleep 10
fi

print_status "Running database migrations..."
cd apps/api
python manage.py makemigrations
python manage.py migrate

print_status "Setting up default company..."

# Get user input for company setup
echo ""
echo "Please provide the following information for your company:"
echo ""

read -p "Company Name: " COMPANY_NAME
read -p "Company Description: " COMPANY_DESCRIPTION
read -p "Manager Email: " MANAGER_EMAIL
read -p "Manager Display Name: " MANAGER_NAME
read -p "Maximum Users (default 50): " MAX_USERS
MAX_USERS=${MAX_USERS:-50}

echo ""
read -p "Create sample users? (y/n): " CREATE_SAMPLE

echo ""
print_status "Creating company with the following details:"
echo "  Company Name: $COMPANY_NAME"
echo "  Manager Email: $MANAGER_EMAIL"
echo "  Manager Name: $MANAGER_NAME"
echo "  Max Users: $MAX_USERS"
echo "  Sample Users: $CREATE_SAMPLE"
echo ""

# Create the company
if [ "$CREATE_SAMPLE" = "y" ] || [ "$CREATE_SAMPLE" = "Y" ]; then
    python manage.py setup_company \
        --company-name "$COMPANY_NAME" \
        --company-description "$COMPANY_DESCRIPTION" \
        --manager-email "$MANAGER_EMAIL" \
        --manager-name "$MANAGER_NAME" \
        --max-users "$MAX_USERS" \
        --create-sample-users
else
    python manage.py setup_company \
        --company-name "$COMPANY_NAME" \
        --company-description "$COMPANY_DESCRIPTION" \
        --manager-email "$MANAGER_EMAIL" \
        --manager-name "$MANAGER_NAME" \
        --max-users "$MAX_USERS"
fi

cd ../..

echo ""
print_success "Company setup completed!"
echo ""
print_status "Next steps:"
echo "1. Log in with your manager account: $MANAGER_EMAIL"
echo "2. Access the admin panel to manage users"
echo "3. Create workspaces for your company"
echo "4. Invite team members to your company"
echo ""
print_status "API Endpoints available:"
echo "  GET    /api/companies/                    - List companies"
echo "  POST   /api/companies/                    - Create company"
echo "  GET    /api/companies/{id}/users/         - List company users"
echo "  POST   /api/companies/{id}/users/         - Add user to company"
echo "  GET    /api/users/                        - List all users (admin)"
echo ""
print_success "Happy managing! 🚀"