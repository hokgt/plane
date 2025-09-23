"""
Role-based permission middleware
Enforces permissions based on user roles
"""

from django.http import JsonResponse
from django.urls import reverse
from django.shortcuts import redirect
from plane.utils.role_permissions import (
    has_permission,
    Permission,
    can_access_admin_panel,
    can_manage_users,
    can_invite_users,
    get_role_description
)


class RolePermissionMiddleware:
    """
    Middleware to enforce role-based permissions
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define protected URLs and required permissions
        self.protected_urls = {
            # Admin panel access
            '/admin/': Permission.ACCESS_ADMIN_PANEL,
            '/api/admin/': Permission.ACCESS_ADMIN_PANEL,
            
            # User management
            '/api/users/': Permission.MANAGE_USERS,
            '/api/workspaces/': Permission.MANAGE_WORKSPACE,
            
            # Team management
            '/api/workspaces/*/members/': Permission.MANAGE_TEAM_MEMBERS,
            '/api/workspaces/*/invitations/': Permission.INVITE_USERS,
        }
    
    def __call__(self, request):
        # Skip permission checks for certain paths
        if self.should_skip_permission_check(request):
            return self.get_response(request)
        
        # Check if user is authenticated
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)
        
        # Check permissions for protected URLs
        response = self.check_permissions(request)
        if response:
            return response
        
        return self.get_response(request)
    
    def should_skip_permission_check(self, request):
        """Check if permission check should be skipped for this request"""
        skip_paths = [
            '/auth/',
            '/api/auth/',
            '/api/instances/',
            '/api/users/me/',
            '/static/',
            '/media/',
        ]
        
        path = request.path
        return any(path.startswith(skip_path) for skip_path in skip_paths)
    
    def check_permissions(self, request):
        """Check if user has required permissions for the request"""
        path = request.path
        method = request.method
        
        # Check admin panel access
        if path.startswith('/admin/') or path.startswith('/api/admin/'):
            if not can_access_admin_panel(request.user):
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'You do not have permission to access the admin panel',
                    'required_permission': 'admin_panel_access'
                }, status=403)
        
        # Check user management permissions
        if path.startswith('/api/users/') and method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if not can_manage_users(request.user):
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'You do not have permission to manage users',
                    'required_permission': 'manage_users'
                }, status=403)
        
        # Check workspace management permissions
        if path.startswith('/api/workspaces/') and method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if not has_permission(request.user, Permission.MANAGE_WORKSPACE):
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'You do not have permission to manage workspaces',
                    'required_permission': 'manage_workspace'
                }, status=403)
        
        # Check team member management permissions
        if '/members/' in path and method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if not has_permission(request.user, Permission.MANAGE_TEAM_MEMBERS):
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'You do not have permission to manage team members',
                    'required_permission': 'manage_team_members'
                }, status=403)
        
        # Check invitation permissions
        if '/invitations/' in path and method in ['POST']:
            if not can_invite_users(request.user):
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'You do not have permission to invite users',
                    'required_permission': 'invite_users'
                }, status=403)
        
        return None

