from django.core.management.base import BaseCommand
from django.contrib import admin
from plane.db.models import User, Company, CompanyUser


class Command(BaseCommand):
    help = 'Test admin configuration and create sample data'

    def handle(self, *args, **options):
        self.stdout.write('Testing admin configuration...')
        
        # Check if admin is registered
        self.stdout.write('Registered models:')
        for model, model_admin in admin.site._registry.items():
            self.stdout.write(f'  - {model.__name__}: {model_admin.__class__.__name__}')
        
        # Check existing data
        self.stdout.write(f'\nExisting data:')
        self.stdout.write(f'  Users: {User.objects.count()}')
        self.stdout.write(f'  Companies: {Company.objects.count()}')
        self.stdout.write(f'  Company Users: {CompanyUser.objects.count()}')
        
        # Create a sample company if none exists
        if Company.objects.count() == 0:
            self.stdout.write('\nCreating sample company...')
            
            # Get or create a manager
            manager, created = User.objects.get_or_create(
                email='manager@example.com',
                defaults={
                    'username': 'manager',
                    'display_name': 'Sample Manager',
                    'user_role': 'manager',
                    'is_active': True,
                    'is_staff': True
                }
            )
            
            if created:
                manager.set_password('manager123')
                manager.save()
                self.stdout.write(f'Created manager: {manager.email}')
            
            # Create company
            company = Company.objects.create(
                name='Sample Company',
                description='A sample company for testing',
                manager=manager,
                max_users=50
            )
            
            # Add manager to company
            CompanyUser.objects.create(
                company=company,
                user=manager,
                role='manager',
                is_active=True
            )
            
            self.stdout.write(f'Created company: {company.name}')
        
        self.stdout.write('\nAdmin setup complete!')
        self.stdout.write('You can now access the admin interface at: http://localhost:8000/admin/')
        self.stdout.write('Login with: admin@textilindo.com / admin123')
