# Plane Company Management System

## Overview

Plane has a comprehensive company separation system that allows multiple companies to operate independently within the same Plane instance. Each company has its own users, workspaces, and settings while maintaining system-wide security and isolation.

## Architecture

### Core Models

#### 1. Company Model
```python
class Company(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(max_length=100, unique=True)
    manager = models.ForeignKey(User, on_delete=models.CASCADE)  # Company manager
    is_active = models.BooleanField(default=True)
    max_users = models.PositiveIntegerField(default=50)
    logo = models.TextField(blank=True, null=True)
    primary_color = models.CharField(max_length=7, default="#3B82F6")
```

#### 2. CompanyUser Model
```python
class CompanyUser(BaseModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(choices=COMPANY_ROLE_CHOICES, default='staff')
    is_active = models.BooleanField(default=True)
    company_display_name = models.CharField(max_length=255, blank=True)
    company_role_title = models.CharField(max_length=255, blank=True)
```

#### 3. User Model Enhancements
```python
class User(AbstractBaseUser, PermissionsMixin):
    # ... existing fields ...
    user_role = models.CharField(max_length=20, choices=USER_ROLE_CHOICES, default='staff')
    primary_company = models.ForeignKey('db.Company', on_delete=models.SET_NULL, null=True)
```

## User Roles and Permissions

### System-Wide Roles
1. **Owner** (`owner`): Full system access, can manage all companies
2. **Manager** (`manager`): Can manage their own companies
3. **Staff** (`staff`): Standard user permissions
4. **Guest** (`guest`): Limited access

### Company-Specific Roles
1. **Manager**: Can manage company users and settings
2. **Staff**: Regular company member
3. **Guest**: Limited company access

## API Endpoints

### Company Management
- `GET /api/companies/` - List companies (filtered by user permissions)
- `POST /api/companies/` - Create new company
- `GET /api/companies/{id}/` - Get company details
- `PATCH /api/companies/{id}/` - Update company
- `DELETE /api/companies/{id}/` - Delete company

### Company User Management
- `GET /api/companies/{id}/users/` - List company users
- `POST /api/companies/{id}/users/` - Add user to company
- `PATCH /api/companies/{id}/users/{user_id}/` - Update company user
- `DELETE /api/companies/{id}/users/{user_id}/` - Remove user from company

### User Management
- `GET /api/users/` - List all users (admin only)
- `PATCH /api/users/{id}/` - Update user role
- `PUT /api/users/{id}/` - Toggle user status

## Setup Guide

### 1. Database Migration
The company system is already set up. If you need to create the tables:
```bash
cd apps/api
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Initial Companies
```python
# Create a company
from plane.db.models import Company, CompanyUser, User

# Create company manager (if not exists)
manager = User.objects.create(
    email='manager@company.com',
    username='manager',
    display_name='Company Manager',
    user_role='manager'
)

# Create company
company = Company.objects.create(
    name='My Company',
    description='Company description',
    manager=manager,
    max_users=100
)

# Add manager to company
CompanyUser.objects.create(
    company=company,
    user=manager,
    role='manager',
    is_active=True
)
```

### 3. Add Users to Company
```python
# Add existing user to company
user = User.objects.get(email='user@company.com')
CompanyUser.objects.create(
    company=company,
    user=user,
    role='staff',
    company_display_name='John Doe',
    company_role_title='Developer',
    is_active=True
)

# Update user's primary company
user.primary_company = company
user.save()
```

## Permission System

### Owner Permissions
- View and manage all companies
- Change user roles system-wide
- Access admin panel
- View system logs

### Manager Permissions
- Manage their own companies
- Invite users to their companies
- Manage company settings
- Cannot change system-wide user roles

### Staff/Guest Permissions
- Access their company's workspaces
- Limited to company-specific operations

## Security Features

1. **Company Isolation**: Users can only see and manage their own companies
2. **Role-Based Access**: Permissions are enforced at both system and company levels
3. **Soft Deletion**: Companies and users are soft-deleted with timestamped slugs
4. **User Limits**: Each company has configurable user limits
5. **Audit Trail**: All operations are tracked with timestamps

## Frontend Integration

The system integrates with Plane's existing frontend through:
- User management pages with company filtering
- Company-specific workspace access
- Role-based UI elements
- Company branding and theming

## Best Practices

1. **Company Creation**: Always assign a manager when creating companies
2. **User Onboarding**: Set primary company for new users
3. **Role Management**: Use company roles for granular permissions
4. **Security**: Regularly audit company memberships
5. **Scaling**: Monitor company user limits and upgrade as needed

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check user's company role and system role
2. **Company Not Found**: Verify company exists and user has access
3. **User Limit Reached**: Increase max_users or remove inactive users
4. **Role Conflicts**: Ensure company and system roles are compatible

### Debug Commands
```python
# Check user's companies
user.get_company_users()

# Check user's permissions
user.has_permission(Permission.MANAGE_USERS)

# List company users
company.get_company_users()
```

## Future Enhancements

1. **Multi-Company Workspaces**: Allow workspaces to span multiple companies
2. **Company Hierarchies**: Support parent-child company relationships
3. **Advanced Permissions**: More granular permission system
4. **Company Analytics**: Usage statistics and reporting per company
5. **SSO Integration**: Company-specific authentication providers