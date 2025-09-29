# Django imports
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Create the system admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@plane.com',
            help='Admin email address (default: admin@plane.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Admin password (default: admin123)',
        )
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username (default: admin)',
        )
        parser.add_argument(
            '--display-name',
            type=str,
            default='System Administrator',
            help='Admin display name (default: System Administrator)',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        username = options['username']
        display_name = options['display_name']

        self.stdout.write('\n' + '='*60)
        self.stdout.write('👑 Creating System Administrator')
        self.stdout.write('='*60)

        try:
            with transaction.atomic():
                # Check if admin already exists
                if User.objects.filter(user_role='owner').exists():
                    self.stdout.write('⚠️  Admin user already exists!')
                    existing_admin = User.objects.filter(user_role='owner').first()
                    self.stdout.write(f'   Email: {existing_admin.email}')
                    self.stdout.write(f'   Username: {existing_admin.username}')
                    self.stdout.write(f'   Role: {existing_admin.user_role}')
                    
                    response = input('\nDo you want to update the existing admin? (y/N): ')
                    if response.lower() != 'y':
                        self.stdout.write('❌ Admin creation cancelled.')
                        return
                    
                    # Update existing admin
                    existing_admin.email = email
                    existing_admin.username = username
                    existing_admin.display_name = display_name
                    existing_admin.is_active = True
                    existing_admin.is_email_verified = True
                    existing_admin.set_password(password)
                    existing_admin.save()
                    
                    self.stdout.write('✅ Admin user updated successfully!')
                else:
                    # Create new admin
                    admin_user = User.objects.create(
                        email=email,
                        username=username,
                        display_name=display_name,
                        user_role='owner',
                        is_active=True,
                        is_email_verified=True,
                        is_superuser=True,
                        is_staff=True
                    )
                    admin_user.set_password(password)
                    admin_user.save()
                    
                    self.stdout.write('✅ Admin user created successfully!')

                # Display admin credentials
                self.stdout.write('\n' + '='*60)
                self.stdout.write('🔑 Admin Credentials')
                self.stdout.write('='*60)
                self.stdout.write(f'Email: {email}')
                self.stdout.write(f'Username: {username}')
                self.stdout.write(f'Password: {password}')
                self.stdout.write(f'Role: Owner (System Administrator)')
                
                self.stdout.write('\n' + '='*60)
                self.stdout.write('🚀 Next Steps')
                self.stdout.write('='*60)
                self.stdout.write('1. Login to the admin panel with these credentials')
                self.stdout.write('2. Navigate to Company Management to create companies')
                self.stdout.write('3. Assign managers to companies')
                self.stdout.write('4. Managers can then add users to their companies')
                
                self.stdout.write('\n💡 Admin Features:')
                self.stdout.write('• Full system access')
                self.stdout.write('• Can create and manage all companies')
                self.stdout.write('• Can change manager roles')
                self.stdout.write('• Can see all users across all companies')
                self.stdout.write('• Access to Company Management in admin panel')
                
        except Exception as e:
            self.stdout.write(f'❌ Error creating admin user: {str(e)}')
            raise

