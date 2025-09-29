# Django imports
from django.urls import path

# Module imports
from plane.app.views.company import (
    CompanyViewSet,
    CompanyUserManagementEndpoint,
    CompanyUserDetailEndpoint
)

urlpatterns = [
    # Company management
    path(
        "companies/",
        CompanyViewSet.as_view({"get": "list", "post": "create"}),
        name="company-list",
    ),
    path(
        "companies/<uuid:pk>/",
        CompanyViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="company-detail",
    ),
    
    # Company user management
    path(
        "companies/<uuid:company_id>/users/",
        CompanyUserManagementEndpoint.as_view(),
        name="company-users",
    ),
    path(
        "companies/<uuid:company_id>/users/<uuid:user_id>/",
        CompanyUserDetailEndpoint.as_view(),
        name="company-user-detail",
    ),
]

