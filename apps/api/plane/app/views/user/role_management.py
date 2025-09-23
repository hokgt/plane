"""
Role-based user management views
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q

from plane.utils.role_permissions import (
    can_manage_users,
    can_invite_users,
    can_view_team_members,
    get_role_description,
    get_available_roles_for_registration,
    has_permission,
    Permission
)

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_management_permissions(request):
    """
    Get user's management permissions
    """
    user = request.user
    
    permissions = {
        'can_manage_users': can_manage_users(user),
        'can_invite_users': can_invite_users(user),
        'can_view_team_members': can_view_team_members(user),
        'can_access_admin_panel': has_permission(user, Permission.ACCESS_ADMIN_PANEL),
        'role_description': get_role_description(user),
        'user_role': user.user_role,
        'is_superuser': user.is_superuser,
    }
    
    return Response(permissions)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_team_members(request):
    """
    Get team members (only if user has permission)
    """
    if not can_view_team_members(request.user):
        return Response({
            'error': 'Access denied',
            'message': 'You do not have permission to view team members'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get all users (simplified for demo)
    users = User.objects.filter(is_active=True).values(
        'id', 'email', 'display_name', 'first_name', 'last_name', 
        'user_role', 'is_active', 'date_joined'
    )
    
    return Response({
        'team_members': list(users),
        'total_count': users.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_roles(request):
    """
    Get available roles for registration/invitation
    """
    if not can_invite_users(request.user):
        return Response({
            'error': 'Access denied',
            'message': 'You do not have permission to invite users'
        }, status=status.HTTP_403_FORBIDDEN)
    
    roles = get_available_roles_for_registration()
    return Response({'roles': roles})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_user_with_role(request):
    """
    Invite a user with a specific role
    """
    if not can_invite_users(request.user):
        return Response({
            'error': 'Access denied',
            'message': 'You do not have permission to invite users'
        }, status=status.HTTP_403_FORBIDDEN)
    
    email = request.data.get('email')
    role = request.data.get('role', 'user')
    workspace_slug = request.data.get('workspace_slug')
    
    if not email:
        return Response({
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate role
    valid_roles = ['admin', 'staff', 'user']
    if role not in valid_roles:
        return Response({
            'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'User with this email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # For now, just return success (actual invitation logic would go here)
    return Response({
        'message': f'Invitation sent to {email} with {role} role',
        'email': email,
        'role': role,
        'workspace': workspace_slug
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_role_info(request):
    """
    Get current user's role information
    """
    user = request.user
    
    return Response({
        'user_id': str(user.id),
        'email': user.email,
        'display_name': user.display_name,
        'user_role': user.user_role,
        'role_description': get_role_description(user),
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'permissions': {
            'can_manage_users': can_manage_users(user),
            'can_invite_users': can_invite_users(user),
            'can_view_team_members': can_view_team_members(user),
            'can_access_admin_panel': has_permission(user, Permission.ACCESS_ADMIN_PANEL),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_user_role(request):
    """
    Change a user's role (only god-admin can do this)
    """
    # Only god-admin can change roles
    if not (request.user.is_superuser and request.user.email == 'admin@textilindo.com'):
        return Response({
            'error': 'Access denied',
            'message': 'Only god-admin can change user roles'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    new_role = request.data.get('new_role')
    
    if not user_id or not new_role:
        return Response({
            'error': 'user_id and new_role are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        
        # Validate new role
        valid_roles = ['admin', 'staff', 'user']
        if new_role not in valid_roles:
            return Response({
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update user role
        old_role = user.user_role
        user.user_role = new_role
        
        # Update additional permissions based on role
        if new_role == 'admin':
            user.is_staff = True
        else:
            user.is_staff = False
        
        user.save()
        
        return Response({
            'message': f'User role changed from {old_role} to {new_role}',
            'user_id': str(user.id),
            'email': user.email,
            'old_role': old_role,
            'new_role': new_role
        })
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

