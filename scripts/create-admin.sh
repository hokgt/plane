#!/bin/bash

echo "👤 Creating Admin User..."
echo "================================"

# Check if API container is running
if ! docker ps | grep -q plan-api-1; then
    echo "❌ API container is not running. Please start the project first."
    echo "💡 Run: ./scripts/start-plane.sh"
    exit 1
fi

# Prompt for admin details
echo "📝 Enter admin user details:"
read -p "Email: " email
read -p "First Name: " first_name
read -p "Last Name: " last_name
read -s -p "Password: " password
echo ""

# Create admin user
echo "🔄 Creating admin user..."
docker exec -it plan-api-1 python manage.py create_admin \
    --email "$email" \
    --first_name "$first_name" \
    --last_name "$last_name" \
    --password "$password"

echo ""
echo "✅ Admin User Created!"
echo "================================"
echo "📧 Email: $email"
echo "💡 You can now login with these credentials."
