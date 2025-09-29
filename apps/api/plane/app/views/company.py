# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django.db.models import Q
from django.contrib.auth import get_user_model

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.serializers.company import (
    CompanyLiteSerializer,
    CompanySerializer,
    CompanyUserSerializer,
    CompanyUserCreateSerializer,
    CompanyCreateSerializer,
    CompanyUpdateSerializer
)
from plane.db.models import Company, CompanyUser, User
from plane.utils.openapi.decorators import user_docs
from plane.utils.openapi import USER_EXAMPLE

User = get_user_model()


class CompanyViewSet(ModelViewSet):
    """Company management endpoints"""
    
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get companies based on user permissions"""
        user = self.request.user
        
        if user.is_owner():
            # Owner can see all companies
            return Company.objects.filter(deleted_at__isnull=True)
        elif user.is_manager():
            # Manager can see companies they manage
            return Company.objects.filter(
                manager=user,
                deleted_at__isnull=True
            )
        else:
            # Other users can see companies they belong to
            return Company.objects.filter(
                company_users__user=user,
                company_users__is_active=True,
                deleted_at__isnull=True
            ).distinct()
    
    def perform_create(self, serializer):
        """Create company with current user as manager"""
        serializer.save(manager=self.request.user)
    
    def perform_update(self, serializer):
        """Update company with permission check"""
        company = self.get_object()
        user = self.request.user
        
        # Only owner or company manager can update
        if not (user.is_owner() or company.manager == user):
            return Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Soft delete company with permission check"""
        user = self.request.user
        
        # Only owner or company manager can delete
        if not (user.is_owner() or instance.manager == user):
            return Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()


class CompanyUserManagementEndpoint(BaseAPIView):
    """Company user management endpoints"""
    
    permission_classes = [IsAuthenticated]
    
    def get_company(self, company_id):
        """Get company with permission check"""
        try:
            company = Company.objects.get(id=company_id, deleted_at__isnull=True)
        except Company.DoesNotExist:
            return None, Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = self.request.user
        
        # Check permissions
        if not (user.is_owner() or company.manager == user):
            return None, Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return company, None
    
    @user_docs(
        operation_id="list_company_users",
        summary="List company users",
        description="Get all users in a specific company",
        responses={
            200: OpenApiResponse(
                description="List of company users",
                response=CompanyUserSerializer,
            ),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="Company not found"),
        },
    )
    def get(self, request, company_id):
        """List all users in a company"""
        company, error_response = self.get_company(company_id)
        if error_response:
            return error_response
        
        # Get query parameters
        search = request.GET.get('search', '')
        role = request.GET.get('role', '')
        is_active = request.GET.get('is_active', '')
        
        # Build query
        queryset = CompanyUser.objects.filter(
            company=company,
            deleted_at__isnull=True
        ).select_related('user', 'company')
        
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(user__display_name__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(company_display_name__icontains=search)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        if is_active != '':
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Order by creation date
        queryset = queryset.order_by('-created_at')
        
        # Serialize and return
        serializer = CompanyUserSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @user_docs(
        operation_id="add_company_user",
        summary="Add user to company",
        description="Add a user to a company with specified role",
        responses={
            201: OpenApiResponse(
                description="User added successfully",
                response=CompanyUserSerializer,
            ),
            400: OpenApiResponse(description="Invalid data"),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="Company not found"),
        },
    )
    def post(self, request, company_id):
        """Add user to company"""
        company, error_response = self.get_company(company_id)
        if error_response:
            return error_response
        
        # Check if company can add more users
        if not company.can_add_user():
            return Response(
                {"error": "Company has reached maximum user limit"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CompanyUserCreateSerializer(
            data=request.data,
            context={'company': company}
        )
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            role = serializer.validated_data['role']
            display_name = serializer.validated_data.get('display_name', '')
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')
            company_role_title = serializer.validated_data.get('company_role_title', '')
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user if doesn't exist
                if not display_name:
                    display_name = email.split('@')[0]
                
                # Generate username from email
                username = email.split('@')[0]
                counter = 1
                original_username = username
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                # Generate temporary password
                import secrets
                import string
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                
                user = User.objects.create(
                    email=email,
                    username=username,
                    display_name=display_name,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                    is_email_verified=True,
                    is_password_autoset=True,
                )
                user.set_password(temp_password)
                user.save()
            
            # Create company user relationship
            company_user = CompanyUser.objects.create(
                company=company,
                user=user,
                role=role,
                company_display_name=display_name or user.display_name,
                company_role_title=company_role_title,
                is_active=True
            )
            
            # Update user's primary company if not set
            if not user.primary_company:
                user.primary_company = company
                user.save()
            
            response_serializer = CompanyUserSerializer(company_user)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompanyUserDetailEndpoint(BaseAPIView):
    """Individual company user management"""
    
    permission_classes = [IsAuthenticated]
    
    def get_company_user(self, company_id, user_id):
        """Get company user with permission check"""
        try:
            company = Company.objects.get(id=company_id, deleted_at__isnull=True)
        except Company.DoesNotExist:
            return None, None, Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            company_user = CompanyUser.objects.get(
                id=user_id,
                company=company,
                deleted_at__isnull=True
            )
        except CompanyUser.DoesNotExist:
            return None, None, Response(
                {"error": "User not found in company"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = self.request.user
        
        # Check permissions
        if not (user.is_owner() or company.manager == user):
            return None, None, Response(
                {"error": "Permission denied"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return company, company_user, None
    
    @user_docs(
        operation_id="update_company_user",
        summary="Update company user",
        description="Update a user's role or status in a company",
        responses={
            200: OpenApiResponse(
                description="User updated successfully",
                response=CompanyUserSerializer,
            ),
            400: OpenApiResponse(description="Invalid data"),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def patch(self, request, company_id, user_id):
        """Update company user"""
        company, company_user, error_response = self.get_company_user(company_id, user_id)
        if error_response:
            return error_response
        
        serializer = CompanyUserSerializer(
            company_user, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @user_docs(
        operation_id="remove_company_user",
        summary="Remove company user",
        description="Remove a user from a company",
        responses={
            204: OpenApiResponse(description="User removed successfully"),
            403: OpenApiResponse(description="Permission denied"),
            404: OpenApiResponse(description="User not found"),
        },
    )
    def delete(self, request, company_id, user_id):
        """Remove user from company"""
        company, company_user, error_response = self.get_company_user(company_id, user_id)
        if error_response:
            return error_response
        
        # Don't allow removing the company manager
        if company_user.is_manager() and company.manager == company_user.user:
            return Response(
                {"error": "Cannot remove company manager"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        company_user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

