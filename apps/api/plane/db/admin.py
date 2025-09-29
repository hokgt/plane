from django.contrib import admin
from .models import Company, CompanyUser, User


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'manager', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'manager__email']


@admin.register(CompanyUser)
class CompanyUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'company__name']
    search_fields = ['user__email', 'company__name']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'display_name', 'user_role', 'is_active', 'is_staff', 'is_superuser']
    list_filter = ['user_role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'display_name']