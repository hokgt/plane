from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from plane.db.models import User, Workspace, WorkspaceMember
from plane.db.models.workspace import ROLE_CHOICES


class Command(BaseCommand):
    help = 'Set up the role-based user management system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing users and recreate the system',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up role-based user management system...'))
        
        if options['reset']:
            self.stdout.write('Resetting existing system...')
            # Don't delete users, just update roles
        
        # 1. Create/Update God-Admin
        self.create_god_admin()
        
        # 2. Create test users for each role
        self.create_test_users()
        
        # 3. Set up workspace permissions
        self.setup_workspace_permissions()
        
        self.stdout.write(self.style.SUCCESS('Role system setup complete!'))
        self.print_system_summary()

    def create_god_admin(self):
        """Create the god-admin account"""
        self.stdout.write('Creating God-Admin account...')
        
        try:
            god_admin = User.objects.get(email='admin@textilindo.com')
            god_admin.user_role = 'admin'
            god_admin.is_superuser = True
            god_admin.is_staff = True
            god_admin.password = make_password('admin123')
            god_admin.save()
            self.stdout.write(f'✅ Updated God-Admin: {god_admin.email}')
        except User.DoesNotExist:
            god_admin = User.objects.create(
                email='admin@textilindo.com',
                username='god-admin',
                display_name='God Admin',
                first_name='God',
                last_name='Admin',
                user_role='admin',
                is_superuser=True,
                is_staff=True,
                is_active=True,
                is_email_verified=True,
                password=make_password('admin123')
            )
            self.stdout.write(f'✅ Created God-Admin: {god_admin.email}')

    def create_test_users(self):
        """Create test users for each role"""
        self.stdout.write('Creating test users...')
        
        # Manager user
        try:
            manager = User.objects.get(email='manager@textilindo.com')
            manager.user_role = 'admin'  # Manager uses admin role
            manager.password = make_password('manager123')
            manager.save()
            self.stdout.write(f'✅ Updated Manager: {manager.email}')
        except User.DoesNotExist:
            manager = User.objects.create(
                email='manager@textilindo.com',
                username='manager',
                display_name='Team Manager',
                first_name='Team',
                last_name='Manager',
                user_role='admin',
                is_active=True,
                is_email_verified=True,
                password=make_password('manager123')
            )
            self.stdout.write(f'✅ Created Manager: {manager.email}')

        # Staff user
        try:
            staff = User.objects.get(email='staff@textilindo.com')
            staff.user_role = 'staff'
            staff.password = make_password('staff123')
            staff.save()
            self.stdout.write(f'✅ Updated Staff: {staff.email}')
        except User.DoesNotExist:
            staff = User.objects.create(
                email='staff@textilindo.com',
                username='staff',
                display_name='Team Staff',
                first_name='Team',
                last_name='Staff',
                user_role='staff',
                is_active=True,
                is_email_verified=True,
                password=make_password('staff123')
            )
            self.stdout.write(f'✅ Created Staff: {staff.email}')

        # Guest user
        try:
            guest = User.objects.get(email='guest@textilindo.com')
            guest.user_role = 'user'
            guest.password = make_password('guest123')
            guest.save()
            self.stdout.write(f'✅ Updated Guest: {guest.email}')
        except User.DoesNotExist:
            guest = User.objects.create(
                email='guest@textilindo.com',
                username='guest',
                display_name='Guest User',
                first_name='Guest',
                last_name='User',
                user_role='user',
                is_active=True,
                is_email_verified=True,
                password=make_password('guest123')
            )
            self.stdout.write(f'✅ Created Guest: {guest.email}')

    def setup_workspace_permissions(self):
        """Set up workspace permissions for different roles"""
        self.stdout.write('Setting up workspace permissions...')
        
        # Get or create a test workspace
        workspace, created = Workspace.objects.get_or_create(
            name='Test Workspace',
            defaults={
                'slug': 'test-workspace',
                'owner': User.objects.get(email='admin@textilindo.com')
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created workspace: {workspace.name}')
        else:
            self.stdout.write(f'✅ Using existing workspace: {workspace.name}')
        
        # Add users to workspace with appropriate roles
        users_roles = [
            ('admin@textilindo.com', 20),  # Admin role
            ('manager@textilindo.com', 20),  # Admin role (Manager)
            ('staff@textilindo.com', 15),   # Member role (Staff)
            ('guest@textilindo.com', 5),     # Guest role
        ]
        
        for email, role in users_roles:
            try:
                user = User.objects.get(email=email)
                workspace_member, created = WorkspaceMember.objects.get_or_create(
                    workspace=workspace,
                    member=user,
                    defaults={
                        'role': role,
                        'is_active': True
                    }
                )
                if not created:
                    workspace_member.role = role
                    workspace_member.is_active = True
                    workspace_member.save()
                
                role_name = dict(ROLE_CHOICES)[role]
                self.stdout.write(f'✅ Added {user.email} as {role_name} to {workspace.name}')
            except User.DoesNotExist:
                self.stdout.write(f'❌ User {email} not found')

    def print_system_summary(self):
        """Print a summary of the role system"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('ROLE SYSTEM SUMMARY'))
        self.stdout.write('='*60)
        
        self.stdout.write('\n🔑 ACCOUNTS:')
        accounts = [
            ('admin@textilindo.com', 'admin123', 'God-Admin', 'Full system access'),
            ('manager@textilindo.com', 'manager123', 'Manager', 'Can manage team, invite users'),
            ('staff@textilindo.com', 'staff123', 'Staff', 'Read-only, can see team'),
            ('guest@textilindo.com', 'guest123', 'Guest', 'Limited access'),
        ]
        
        for email, password, role, description in accounts:
            self.stdout.write(f'  {email} / {password} - {role} ({description})')
        
        self.stdout.write('\n📋 PERMISSIONS:')
        self.stdout.write('  God-Admin: Can change manager roles, full system access')
        self.stdout.write('  Manager: Can see user management, invite team members')
        self.stdout.write('  Staff: Read-only access, can see team members')
        self.stdout.write('  Guest: Limited access to assigned items')
        
        self.stdout.write('\n🎯 NEXT STEPS:')
        self.stdout.write('  1. Test login with different accounts')
        self.stdout.write('  2. Check user management permissions')
        self.stdout.write('  3. Test invitation system')
        self.stdout.write('  4. Verify role-based access control')
        
        self.stdout.write('\n' + '='*60)

