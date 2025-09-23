# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponseRedirect, JsonResponse
from django.views import View
from django.contrib.auth.hashers import make_password

# Module imports
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import User
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import validate_next_path


class RoleBasedSignUpEndpoint(View):
    """
    Custom sign-up endpoint that includes role selection
    Roles: god-admin, manager, staff, guest
    """
    
    def post(self, request):
        next_path = request.POST.get("next_path")
        
        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-up?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Get form data
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        user_role = request.POST.get("user_role", "user").strip()
        
        # Validate required fields
        if not email or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message="Email and password are required",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-up?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message="Please provide a valid email address",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-up?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        # Validate role
        valid_roles = ['admin', 'staff', 'user']  # Based on USER_ROLE_CHOICES
        if user_role not in valid_roles:
            user_role = 'user'  # Default to user role

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ALREADY_EXISTS"],
                error_message="User with this email already exists",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-up?" + urlencode(params)
            )
            return HttpResponseRedirect(url)

        try:
            # Create user with role
            display_name = f"{first_name} {last_name}".strip() or email.split('@')[0]
            
            user = User.objects.create(
                email=email,
                username=email.split('@')[0],  # Use email prefix as username
                first_name=first_name,
                last_name=last_name,
                display_name=display_name,
                user_role=user_role,
                password=make_password(password),
                is_active=True,
                is_email_verified=True,  # Auto-verify for development
            )
            
            # Set additional permissions based on role
            if user_role == 'admin':
                user.is_staff = True
                user.save()
            
            # Login the user
            user_login(request=request, user=user, is_app=True)
            
            # Get redirection path
            if next_path:
                path = str(validate_next_path(next_path))
            else:
                path = get_redirection_path(user=user)
            
            # Redirect to success page
            url = urljoin(base_host(request=request, is_app=True), path)
            return HttpResponseRedirect(url)
            
        except Exception as e:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message=f"Registration failed: {str(e)}",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-up?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class RoleSelectionEndpoint(View):
    """
    API endpoint to get available roles for registration
    """
    
    def get(self, request):
        roles = [
            {
                'value': 'user',
                'label': 'Guest',
                'description': 'Limited access, can view assigned items'
            },
            {
                'value': 'staff',
                'label': 'Staff',
                'description': 'Can view team members and assigned work items'
            },
            {
                'value': 'admin',
                'label': 'Manager',
                'description': 'Can manage team members and invite users'
            }
        ]
        
        return JsonResponse({
            'roles': roles,
            'default_role': 'user'
        })

