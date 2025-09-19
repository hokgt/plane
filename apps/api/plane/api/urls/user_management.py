# Django imports
from django.urls import path

# Module imports
from plane.api.views.user_management import UserManagementEndpoint, UserDetailEndpoint

urlpatterns = [
    path("users/", UserManagementEndpoint.as_view(), name="user-management"),
    path("users/<uuid:user_id>/", UserDetailEndpoint.as_view(), name="user-detail"),
    path("users/<uuid:user_id>/role/", UserManagementEndpoint.as_view(), name="user-role-update"),
    path("users/<uuid:user_id>/status/", UserManagementEndpoint.as_view(), name="user-status-toggle"),
]
