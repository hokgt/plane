"""
Development authentication views
Bypasses magic code system for easier development
"""

from urllib.parse import urlencode, urljoin
from django.http import HttpResponseRedirect
from django.views import View
from django.contrib.auth.hashers import make_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.host import base_host
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import User
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import validate_next_path


class DevSignInEndpoint(View):
    """
    Development sign-in endpoint that bypasses magic code
    """
    
    def post(self, request):
        next_path = request.POST.get("next_path")
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        
        if not email or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message="Email and password are required",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-in?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
        
        try:
            # Find user by email
            user = User.objects.get(email=email)
            
            # Check password (simple check for development)
            if user.check_password(password):
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
            else:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                    error_message="Invalid email or password",
                )
                
        except User.DoesNotExist:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message="User not found",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-in?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
        except Exception as e:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INVALID_CREDENTIALS"],
                error_message=f"Login failed: {str(e)}",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = urljoin(
                base_host(request=request, is_app=True), "sign-in?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class DevSignUpEndpoint(View):
    """
    Development sign-up endpoint with role selection
    """
    
    def post(self, request):
        next_path = request.POST.get("next_path")
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        user_role = request.POST.get("user_role", "user").strip()
        
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
            # Create user
            display_name = f"{first_name} {last_name}".strip() or email.split('@')[0]
            
            user = User.objects.create(
                email=email,
                username=email.split('@')[0],
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

