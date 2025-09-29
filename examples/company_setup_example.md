# Company Management Setup Examples

## Quick Setup with Script

### 1. Run the Setup Script
```bash
./setup_company_system.sh
```

This will guide you through creating your first company with:
- Company name and description
- Manager email and details
- User limits
- Sample users (optional)

### 2. Example Setup
```
Company Name: Acme Corporation
Company Description: Software development company
Manager Email: admin@acme.com
Manager Display Name: John Admin
Maximum Users: 100
Create sample users: Yes
```

## Manual Setup via Django Admin

### 1. Access Django Admin
```bash
cd apps/api
python manage.py runserver
```
Visit: http://localhost:8000/admin/

### 2. Create Company
1. Go to "Companies" section
2. Click "Add Company"
3. Fill in company details
4. Assign a manager

### 3. Add Users
1. Go to "Company Users" section
2. Click "Add Company User"
3. Link existing users to companies
4. Set company-specific roles

## API Examples

### Create Company
```bash
curl -X POST http://localhost:8000/api/companies/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "description": "Company description",
    "max_users": 50,
    "primary_color": "#3B82F6"
  }'
```

### Add User to Company
```bash
curl -X POST http://localhost:8000/api/companies/COMPANY_ID/users/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "display_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "role": "staff",
    "company_role_title": "Developer"
  }'
```

### List Company Users
```bash
curl -X GET http://localhost:8000/api/companies/COMPANY_ID/users/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### 1. Add Company Management to Navigation
Add to your workspace settings navigation:
```tsx
{
  label: "Company Management",
  href: `/${workspaceSlug}/settings/company-management`,
  icon: Building2,
  access: EUserPermissionsLevel.ADMIN
}
```

### 2. Use Company Service
```tsx
import { CompanyService } from "@/core/services/company.service";

const companyService = new CompanyService();

// Get all companies
const companies = await companyService.getCompanies();

// Create new company
const newCompany = await companyService.createCompany({
  name: "New Company",
  description: "Company description",
  max_users: 50
});
```

## Role-Based Access Control

### Owner Permissions
- View and manage all companies
- Change user roles system-wide
- Access admin panel
- Delete companies

### Manager Permissions
- Manage their own companies
- Invite users to their companies
- Cannot change system-wide user roles

### Staff/Guest Permissions
- View their company information
- Access company workspaces
- Limited company operations

## Best Practices

### 1. Company Structure
- Create companies for different departments/teams
- Use descriptive names and descriptions
- Set appropriate user limits
- Assign proper managers

### 2. User Management
- Set primary company for all users
- Use company-specific roles appropriately
- Regularly audit company memberships
- Implement proper onboarding flow

### 3. Security
- Regularly review company access
- Monitor user permissions
- Use strong authentication
- Implement audit logging

### 4. Scaling
- Monitor company user limits
- Plan for company growth
- Use appropriate role hierarchies
- Implement automation where possible

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check user's system role (owner/manager)
   - Verify company membership
   - Ensure proper authentication

2. **Company Not Found**
   - Check company ID
   - Verify company exists
   - Check user's company access

3. **User Limit Reached**
   - Increase max_users setting
   - Remove inactive users
   - Upgrade company plan

4. **Role Conflicts**
   - Check system vs company roles
   - Ensure role compatibility
   - Review permission inheritance

### Debug Commands

```python
# Check user's companies
user.get_company_users()

# Check company user count
company.get_user_count()

# List company users
company.get_company_users()

# Check permissions
user.has_permission(Permission.MANAGE_USERS)
```

## Migration from Existing System

If you have an existing Plane installation:

1. **Backup Database**
   ```bash
   python manage.py dumpdata > backup.json
   ```

2. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Create Default Company**
   ```bash
   python manage.py setup_company --manager-email admin@yourcompany.com
   ```

4. **Migrate Existing Users**
   - Assign users to companies
   - Set appropriate roles
   - Update primary companies

5. **Test System**
   - Verify company isolation
   - Test user permissions
   - Check workspace access
