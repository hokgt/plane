#!/usr/bin/env python
"""
Simple Django server for Plane development
This bypasses the complex Plane configuration and provides basic API endpoints
"""
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.dev')

import django
django.setup()

from django.conf import settings
from django.core.wsgi import get_wsgi_application
from django.http import JsonResponse
from django.urls import path
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Configure Django settings
if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='dev-secret-key-for-testing',
        ALLOWED_HOSTS=['*'],
        INSTALLED_APPS=[
            'django.contrib.admin',
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.messages',
            'django.contrib.staticfiles',
            'rest_framework',
            'corsheaders',
        ],
        MIDDLEWARE=[
            'corsheaders.middleware.CorsMiddleware',
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.middleware.csrf.CsrfViewMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
            'django.middleware.clickjacking.XFrameOptionsMiddleware',
        ],
        ROOT_URLCONF=__name__,
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': 'simple_plane.db',
            }
        },
        STATIC_URL='/static/',
        CORS_ALLOWED_ORIGINS=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
        ],
        CORS_ALLOW_CREDENTIALS=True,
        REST_FRAMEWORK={
            'DEFAULT_AUTHENTICATION_CLASSES': [
                'rest_framework.authentication.SessionAuthentication',
            ],
            'DEFAULT_PERMISSION_CLASSES': [
                'rest_framework.permissions.AllowAny',
            ],
        }
    )

# API Views
@api_view(['GET'])
def api_health(request):
    """Health check endpoint"""
    return Response({
        'status': 'ok',
        'message': 'Plane API is running',
        'version': '0.1.0'
    })

@api_view(['GET'])
def api_user_profile(request):
    """Get user profile"""
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        })
    return Response({'error': 'Not authenticated'}, status=401)

@api_view(['POST'])
def api_login(request):
    """Simple login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=400)
    
    user = authenticate(username=username, password=password)
    if user:
        login(request, user)
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        })
    
    return Response({'error': 'Invalid credentials'}, status=401)

@api_view(['GET'])
def api_projects(request):
    """Mock projects endpoint"""
    return Response({
        'results': [
            {
                'id': 1,
                'name': 'Sample Project',
                'description': 'A sample project for development',
                'created_at': '2024-01-01T00:00:00Z'
            }
        ]
    })

@api_view(['GET'])
def api_companies(request):
    """Companies endpoint"""
    import sqlite3
    import json
    
    try:
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, slug, description, is_active, max_users, primary_color, created_at FROM companies WHERE deleted_at IS NULL;')
        companies = cursor.fetchall()
        conn.close()
        
        result = []
        for company in companies:
            result.append({
                'id': company[0],
                'name': company[1],
                'slug': company[2],
                'description': company[3],
                'is_active': bool(company[4]),
                'max_users': company[5],
                'primary_color': company[6],
                'created_at': company[7],
                'current_user_count': 1,  # Mock value
                'can_add_users': True,    # Mock value
                'manager_email': 'admin@textilindo.com',  # Mock value
                'manager_display_name': 'God Admin',  # Mock value
                'logo_url': None,
                'updated_at': company[7]
            })
        
        return Response(result)
    except Exception as e:
        return Response({'error': f'Failed to fetch companies: {str(e)}'}, status=500)

@api_view(['GET'])
def api_company_users(request, company_id):
    """Company users endpoint"""
    import sqlite3
    
    try:
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        
        # Get company users
        cursor.execute('''
            SELECT cu.id, cu.role, cu.is_active, cu.joined_at, cu.company_display_name, cu.company_role_title,
                   u.email, u.display_name, u.first_name, u.last_name, c.name
            FROM company_users cu
            JOIN users u ON cu.user_id = u.id
            JOIN companies c ON cu.company_id = c.id
            WHERE cu.company_id = ? AND cu.deleted_at IS NULL
        ''', (company_id,))
        
        users = cursor.fetchall()
        conn.close()
        
        result = []
        for user in users:
            result.append({
                'id': user[0],
                'company': company_id,
                'user': user[6],  # email
                'role': user[1],
                'is_active': bool(user[2]),
                'joined_at': user[3],
                'company_display_name': user[4],
                'company_role_title': user[5],
                'user_email': user[6],
                'user_display_name': user[7] or user[6],
                'user_first_name': user[8],
                'user_last_name': user[9],
                'user_avatar': None,
                'company_name': user[10],
                'created_at': user[3],
                'updated_at': user[3]
            })
        
        return Response(result)
    except Exception as e:
        return Response({'error': f'Failed to fetch company users: {str(e)}'}, status=500)

@api_view(['POST'])
def api_create_company(request):
    """Create company endpoint"""
    import sqlite3
    import uuid
    from datetime import datetime
    
    try:
        name = request.data.get('name')
        description = request.data.get('description', '')
        max_users = request.data.get('max_users', 50)
        primary_color = request.data.get('primary_color', '#3B82F6')
        
        if not name:
            return Response({'error': 'Company name is required'}, status=400)
        
        # Generate slug from name
        slug = name.lower().replace(' ', '-').replace('_', '-')
        
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        
        # Get admin user as manager
        cursor.execute('SELECT id FROM users WHERE user_role = "owner" LIMIT 1;')
        admin_user = cursor.fetchone()
        if not admin_user:
            conn.close()
            return Response({'error': 'No admin user found'}, status=500)
        
        company_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO companies (id, name, slug, description, is_active, max_users, primary_color, manager_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (company_id, name, slug, description, 1, max_users, primary_color, admin_user[0], now, now))
        
        conn.commit()
        conn.close()
        
        return Response({
            'id': company_id,
            'name': name,
            'slug': slug,
            'description': description,
            'is_active': True,
            'max_users': max_users,
            'primary_color': primary_color,
            'current_user_count': 0,
            'can_add_users': True,
            'manager_email': 'admin@textilindo.com',
            'manager_display_name': 'God Admin',
            'logo_url': None,
            'created_at': now,
            'updated_at': now
        }, status=201)
        
    except Exception as e:
        return Response({'error': f'Failed to create company: {str(e)}'}, status=500)

@api_view(['POST'])
def api_add_company_user(request, company_id):
    """Add user to company endpoint"""
    import sqlite3
    import uuid
    from datetime import datetime
    
    try:
        email = request.data.get('email')
        role = request.data.get('role', 'staff')
        display_name = request.data.get('display_name', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        company_role_title = request.data.get('company_role_title', '')
        
        if not email:
            return Response({'error': 'Email is required'}, status=400)
        
        conn = sqlite3.connect('db.sqlite3')
        cursor = conn.cursor()
        
        # Check if company exists
        cursor.execute('SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL;', (company_id,))
        if not cursor.fetchone():
            conn.close()
            return Response({'error': 'Company not found'}, status=404)
        
        # Check if user exists
        cursor.execute('SELECT id, display_name FROM users WHERE email = ?;', (email,))
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            username = email.split('@')[0]
            now = datetime.now().isoformat()
            
            cursor.execute('''
                INSERT INTO users (id, email, username, display_name, first_name, last_name, 
                                 is_active, is_email_verified, user_role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, email, username, display_name or email.split('@')[0], 
                  first_name, last_name, 1, 1, 'staff', now, now))
        else:
            user_id = user[0]
            if not display_name:
                display_name = user[1] or email.split('@')[0]
        
        # Add user to company
        company_user_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO company_users (id, company_id, user_id, role, is_active, joined_at, 
                                     company_display_name, company_role_title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (company_user_id, company_id, user_id, role, 1, now, 
              display_name, company_role_title, now, now))
        
        conn.commit()
        conn.close()
        
        return Response({
            'id': company_user_id,
            'company': company_id,
            'user': email,
            'role': role,
            'is_active': True,
            'joined_at': now,
            'company_display_name': display_name,
            'company_role_title': company_role_title,
            'user_email': email,
            'user_display_name': display_name,
            'user_first_name': first_name,
            'user_last_name': last_name,
            'user_avatar': None,
            'company_name': 'Company Name',  # Mock value
            'created_at': now,
            'updated_at': now
        }, status=201)
        
    except Exception as e:
        return Response({'error': f'Failed to add user to company: {str(e)}'}, status=500)

# URL patterns
def home(request):
    return JsonResponse({
        'message': 'Welcome to Plane API',
        'endpoints': {
            'health': '/api/health/',
            'profile': '/api/auth/profile/',
            'login': '/api/auth/login/',
            'projects': '/api/projects/',
            'companies': '/api/companies/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', home),
    path('api/health/', api_health),
    path('api/auth/profile/', api_user_profile),
    path('api/auth/login/', api_login),
    path('api/projects/', api_projects),
    path('api/companies/', api_companies),
    path('api/companies/', api_create_company),
    path('api/companies/<str:company_id>/users/', api_company_users),
    path('api/companies/<str:company_id>/users/', api_add_company_user),
    path('admin/', django.contrib.admin.site.urls),
]

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
