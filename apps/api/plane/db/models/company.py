# Python imports
import uuid
from typing import Optional, Any

# Django imports
from django.db import models
from django.conf import settings

# Module imports
from .base import BaseModel


class Company(BaseModel):
    """
    Company model to encapsulate users within companies
    Each company has one manager who can manage users within that company
    """
    
    id = models.UUIDField(
        default=uuid.uuid4, 
        unique=True, 
        editable=False, 
        db_index=True, 
        primary_key=True
    )
    name = models.CharField(max_length=255, verbose_name="Company Name")
    description = models.TextField(blank=True, null=True, verbose_name="Company Description")
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    
    # Manager who manages this company
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="managed_companies",
        verbose_name="Company Manager"
    )
    
    # Company settings
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    max_users = models.PositiveIntegerField(
        default=50, 
        verbose_name="Maximum Users",
        help_text="Maximum number of users allowed in this company"
    )
    
    # Company branding
    logo = models.TextField(blank=True, null=True, verbose_name="Company Logo")
    logo_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="company_logo",
        blank=True,
        null=True,
    )
    primary_color = models.CharField(max_length=7, default="#3B82F6", verbose_name="Primary Color")
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        db_table = "companies"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["slug"],
                condition=models.Q(deleted_at__isnull=True),
                name="company_unique_slug_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.name} (Managed by {self.manager.email})"
    
    @property
    def logo_url(self):
        """Return the logo asset url if it exists"""
        if self.logo_asset:
            return self.logo_asset.asset_url
        if self.logo:
            return self.logo
        return None
    
    def get_user_count(self):
        """Get the current number of users in this company"""
        return self.company_users.filter(is_active=True).count()
    
    def can_add_user(self):
        """Check if company can add more users"""
        return self.get_user_count() < self.max_users
    
    def get_company_users(self):
        """Get all users in this company"""
        return self.company_users.filter(is_active=True).select_related('user')
    
    def delete(self, using: Optional[str] = None, soft: bool = True, *args: Any, **kwargs: Any):
        """
        Override the delete method to append epoch timestamp to the slug when soft deleting.
        """
        result = super().delete(using=using, soft=soft, *args, **kwargs)
        
        if soft and hasattr(self, "deleted_at") and self.deleted_at:
            deletion_timestamp: int = int(self.deleted_at.timestamp())
            self.slug = f"{self.slug}__{deletion_timestamp}"
            self.save(update_fields=["slug"])
        
        return result


class CompanyUser(BaseModel):
    """
    Junction model to link users to companies
    This allows users to belong to multiple companies with different roles
    """
    
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="company_users",
        verbose_name="Company"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_companies",
        verbose_name="User"
    )
    
    # Role within this specific company
    COMPANY_ROLE_CHOICES = (
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('guest', 'Guest'),
    )
    role = models.CharField(
        max_length=20,
        choices=COMPANY_ROLE_CHOICES,
        default='staff',
        verbose_name="Role in Company"
    )
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name="Joined At")
    
    # Company-specific user data
    company_display_name = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name="Display Name in Company"
    )
    company_role_title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Job Title in Company"
    )
    
    class Meta:
        unique_together = ["company", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="company_user_unique_company_user_when_deleted_at_null",
            )
        ]
        verbose_name = "Company User"
        verbose_name_plural = "Company Users"
        db_table = "company_users"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} in {self.company.name} as {self.role}"
    
    def is_manager(self):
        """Check if user is manager of this company"""
        return self.role == 'manager'
    
    def is_staff(self):
        """Check if user is staff in this company"""
        return self.role == 'staff'
    
    def is_guest(self):
        """Check if user is guest in this company"""
        return self.role == 'guest'

