"""
Role-based permission system for Plane
Defines what each role can and cannot do
"""

from enum import Enum
from typing import List, Dict, Any
from django.contrib.auth.models import User


class UserRole(Enum):
    """User role enumeration"""
    OWNER = 'owner'
    MANAGER = 'manager'
    STAFF = 'staff'
    GUEST = 'user'


class Permission(Enum):
    """Permission enumeration"""
    # User Management
    VIEW_ALL_USERS = 'view_all_users'
    MANAGE_USERS = 'manage_users'
    CHANGE_USER_ROLES = 'change_user_roles'
    INVITE_USERS = 'invite_users'
    
    # Workspace Management
    CREATE_WORKSPACE = 'create_workspace'
    MANAGE_WORKSPACE = 'manage_workspace'
    DELETE_WORKSPACE = 'delete_workspace'
    
    # Team Management
    VIEW_TEAM_MEMBERS = 'view_team_members'
    MANAGE_TEAM_MEMBERS = 'manage_team_members'
    INVITE_TEAM_MEMBERS = 'invite_team_members'
    
    # Project Management
    CREATE_PROJECTS = 'create_projects'
    MANAGE_PROJECTS = 'manage_projects'
    DELETE_PROJECTS = 'delete_projects'
    
    # Issue Management
    CREATE_ISSUES = 'create_issues'
    EDIT_ISSUES = 'edit_issues'
    DELETE_ISSUES = 'delete_issues'
    ASSIGN_ISSUES = 'assign_issues'
    
    # System Administration
    ACCESS_ADMIN_PANEL = 'access_admin_panel'
    MANAGE_SYSTEM_SETTINGS = 'manage_system_settings'
    VIEW_SYSTEM_LOGS = 'view_system_logs'


# Role-based permission mapping
ROLE_PERMISSIONS = {
    UserRole.OWNER: [
        # Full system access - can change manager roles
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_USERS,
        Permission.CHANGE_USER_ROLES,
        Permission.INVITE_USERS,
        Permission.CREATE_WORKSPACE,
        Permission.MANAGE_WORKSPACE,
        Permission.DELETE_WORKSPACE,
        Permission.VIEW_TEAM_MEMBERS,
        Permission.MANAGE_TEAM_MEMBERS,
        Permission.INVITE_TEAM_MEMBERS,
        Permission.CREATE_PROJECTS,
        Permission.MANAGE_PROJECTS,
        Permission.DELETE_PROJECTS,
        Permission.CREATE_ISSUES,
        Permission.EDIT_ISSUES,
        Permission.DELETE_ISSUES,
        Permission.ASSIGN_ISSUES,
        Permission.ACCESS_ADMIN_PANEL,
        Permission.VIEW_SYSTEM_LOGS,
    ],
    
    UserRole.MANAGER: [
        # Manager permissions - can see "User Management" tab, invite team
        Permission.VIEW_ALL_USERS,
        Permission.INVITE_USERS,
        Permission.CREATE_WORKSPACE,
        Permission.MANAGE_WORKSPACE,
        Permission.VIEW_TEAM_MEMBERS,
        Permission.MANAGE_TEAM_MEMBERS,
        Permission.INVITE_TEAM_MEMBERS,
        Permission.CREATE_PROJECTS,
        Permission.MANAGE_PROJECTS,
        Permission.CREATE_ISSUES,
        Permission.EDIT_ISSUES,
        Permission.ASSIGN_ISSUES,
        # Cannot change user roles (only owner can)
    ],
    
    UserRole.STAFF: [
        # Staff permissions - can see team members (NOT "User Management" tab)
        Permission.VIEW_TEAM_MEMBERS,
        Permission.CREATE_ISSUES,
        Permission.EDIT_ISSUES,
        # Cannot invite users or manage roles
    ],
    
    UserRole.GUEST: [
        # Guest permissions - limited access
        Permission.CREATE_ISSUES,
        # Cannot see team management
    ],
}


def get_user_permissions(user: User) -> List[Permission]:
    """
    Get permissions for a user based on their role
    """
    if not user.is_active:
        return []
    
    # Check if user is god-admin (superuser)
    if user.is_superuser and user.email == 'admin@textilindo.com':
        return ROLE_PERMISSIONS[UserRole.GOD_ADMIN]
    
    # Check user role
    user_role = UserRole(user.user_role) if hasattr(user, 'user_role') else UserRole.GUEST
    
    # Special case: if user is manager@textilindo.com, they get manager permissions
    if user.email == 'manager@textilindo.com':
        return ROLE_PERMISSIONS[UserRole.MANAGER]
    
    return ROLE_PERMISSIONS.get(user_role, ROLE_PERMISSIONS[UserRole.GUEST])


def has_permission(user: User, permission: Permission) -> bool:
    """
    Check if a user has a specific permission
    """
    user_permissions = get_user_permissions(user)
    return permission in user_permissions


def can_manage_users(user: User) -> bool:
    """Check if user can manage other users"""
    return has_permission(user, Permission.MANAGE_USERS)


def can_invite_users(user: User) -> bool:
    """Check if user can invite other users"""
    return has_permission(user, Permission.INVITE_USERS)


def can_view_team_members(user: User) -> bool:
    """Check if user can view team members"""
    return has_permission(user, Permission.VIEW_TEAM_MEMBERS)


def can_manage_team_members(user: User) -> bool:
    """Check if user can manage team members"""
    return has_permission(user, Permission.MANAGE_TEAM_MEMBERS)


def can_access_admin_panel(user: User) -> bool:
    """Check if user can access admin panel"""
    return has_permission(user, Permission.ACCESS_ADMIN_PANEL)


def get_role_description(user: User) -> str:
    """Get human-readable description of user's role"""
    if user.is_superuser and user.email == 'admin@textilindo.com':
        return "God-Admin: Full system access, can change manager roles"
    elif user.email == 'manager@textilindo.com':
        return "Manager: Can see 'User Management' tab, can invite team members"
    elif user.user_role == 'staff':
        return "Staff: Can see team members (NOT 'User Management' tab), read-only access"
    elif user.user_role == 'user':
        return "Guest: Limited access to assigned items only"
    else:
        return "Unknown role"


def get_available_roles_for_registration() -> List[Dict[str, Any]]:
    """Get available roles for user registration"""
    return [
        {
            'value': 'user',
            'label': 'Guest',
            'description': 'Limited access to assigned items only',
            'permissions': ['create_issues']
        },
        {
            'value': 'staff',
            'label': 'Staff',
            'description': 'Can see team members (NOT User Management tab), read-only access',
            'permissions': ['view_team_members', 'create_issues', 'edit_issues']
        },
        {
            'value': 'manager',
            'label': 'Manager',
            'description': 'Can see User Management tab, can invite team members',
            'permissions': ['view_all_users', 'invite_users', 'manage_team_members', 'create_projects', 'manage_projects']
        }
    ]
