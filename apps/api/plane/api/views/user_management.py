# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import OpenApiResponse
from django.db.models import Q
from django.contrib.auth import get_user_model

# Module imports
from plane.api.serializers import UserLiteSerializer
from plane.api.views.base import BaseAPIView
from plane.db.models import User
from plane.utils.openapi.decorators import user_docs
from plane.utils.openapi import USER_EXAMPLE

User = get_user_model()


class UserManagementEndpoint(BaseAPIView):
    """
    User management endpoints for admin users
    """
    permission_classes = [IsAuthenticated]
    
    def check_admin_permission(self, request):
        """Check if user has admin permissions"""
        if not request.user.is_admin():
            return Response(
                {"error": "Admin permissions required"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    @user_docs(
        operation_id="list_all_users",
        summary="List all users",
        description="Retrieve a list of all users in the system (Admin only)",
        responses={
            200: OpenApiResponse(
                description="List of users",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
            403: OpenApiResponse(description="Admin permissions required"),
        },
    )
    def get(self, request):
        """List all users
        
        Retrieve a list of all users in the system.
        Only accessible by admin users.
        """
        # Check admin permissions
        permission_error = self.check_admin_permission(request)
        if permission_error:
            return permission_error
            
        # Get query parameters
        search = request.GET.get('search', '')
        role = request.GET.get('role', '')
        is_active = request.GET.get('is_active', '')
        
        # Build query
        queryset = User.objects.all()
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(display_name__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
            
        if role:
            queryset = queryset.filter(user_role=role)
            
        if is_active != '':
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Serialize and return
        serializer = UserLiteSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @user_docs(
        operation_id="update_user_role",
        summary="Update user role",
        description="Update a user's role (Admin only)",
        responses={
            200: OpenApiResponse(
                description="User updated successfully",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
            400: OpenApiResponse(description="Invalid data"),
            403: OpenApiResponse(description="Admin permissions required"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def patch(self, request, user_id):
        """Update user role
        
        Update a user's role in the system.
        Only accessible by admin users.
        """
        # Check admin permissions
        permission_error = self.check_admin_permission(request)
        if permission_error:
            return permission_error
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get new role from request
        new_role = request.data.get('user_role')
        if not new_role or new_role not in ['admin', 'staff', 'user']:
            return Response(
                {"error": "Invalid role. Must be 'admin', 'staff', or 'user'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent admin from changing their own role
        if user.id == request.user.id and new_role != 'admin':
            return Response(
                {"error": "Cannot change your own admin role"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user role
        user.user_role = new_role
        user.save()
        
        # Serialize and return
        serializer = UserLiteSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @user_docs(
        operation_id="toggle_user_status",
        summary="Toggle user active status",
        description="Activate or deactivate a user (Admin only)",
        responses={
            200: OpenApiResponse(
                description="User status updated successfully",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
            400: OpenApiResponse(description="Invalid data"),
            403: OpenApiResponse(description="Admin permissions required"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def put(self, request, user_id):
        """Toggle user active status
        
        Activate or deactivate a user in the system.
        Only accessible by admin users.
        """
        # Check admin permissions
        permission_error = self.check_admin_permission(request)
        if permission_error:
            return permission_error
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent admin from deactivating themselves
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot deactivate your own account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle active status
        user.is_active = not user.is_active
        user.save()
        
        # Serialize and return
        serializer = UserLiteSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailEndpoint(BaseAPIView):
    """
    Individual user detail endpoints
    """
    permission_classes = [IsAuthenticated]
    
    def check_admin_permission(self, request):
        """Check if user has admin permissions"""
        if not request.user.is_admin():
            return Response(
                {"error": "Admin permissions required"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    @user_docs(
        operation_id="get_user_details",
        summary="Get user details",
        description="Retrieve detailed information about a specific user (Admin only)",
        responses={
            200: OpenApiResponse(
                description="User details",
                response=UserLiteSerializer,
                examples=[USER_EXAMPLE],
            ),
            403: OpenApiResponse(description="Admin permissions required"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def get(self, request, user_id):
        """Get user details
        
        Retrieve detailed information about a specific user.
        Only accessible by admin users.
        """
        # Check admin permissions
        permission_error = self.check_admin_permission(request)
        if permission_error:
            return permission_error
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize and return
        serializer = UserLiteSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
