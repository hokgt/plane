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
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'simple_settings')

import django
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

django.setup()

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

# URL patterns
def home(request):
    return JsonResponse({
        'message': 'Welcome to Plane API',
        'endpoints': {
            'health': '/api/health/',
            'profile': '/api/auth/profile/',
            'login': '/api/auth/login/',
            'projects': '/api/projects/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', home),
    path('api/health/', api_health),
    path('api/auth/profile/', api_user_profile),
    path('api/auth/login/', api_login),
    path('api/projects/', api_projects),
    path('admin/', django.contrib.admin.site.urls),
]

if __name__ == '__main__':
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
