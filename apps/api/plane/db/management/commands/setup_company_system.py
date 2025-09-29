# Django imports
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

# Module imports
from plane.db.models import Company, CompanyUser, User

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up the company-based user management system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-sample-data',
            action='store_true',
            help='Create sample companies and users for testing',
        )

    def handle(self, *args, **options):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('🏢 Setting up Company-based User Management System')
        self.stdout.write('='*60)
        
        if options['create_sample_data']:
            self.create_sample_companies()
            self.create_sample_users()
            self.setup_company_users()
            self.print_system_summary()
        else:
            self.stdout.write('✅ Company system models are ready!')
            self.stdout.write('💡 Run with --create-sample-data to create test data')

    def create_sample_companies(self):
        """Create sample companies"""
        self.stdout.write('\n📊 Creating sample companies...')
        
        companies_data = [
            {
                'name': 'TechCorp Solutions',
                'description': 'Leading technology solutions provider',
                'max_users': 25,
                'primary_color': '#3B82F6'
            },
            {
                'name': 'InnovateLabs',
                'description': 'Innovation and research company',
                'max_users': 15,
                'primary_color': '#10B981'
            },
            {
                'name': 'DataFlow Systems',
                'description': 'Data analytics and business intelligence',
                'max_users': 30,
                'primary_color': '#F59E0B'
            }
        ]
        
        for company_data in companies_data:
            # Get or create manager for this company
            manager_email = f"manager@{company_data['name'].lower().replace(' ', '')}.com"
            manager, created = User.objects.get_or_create(
                email=manager_email,
                defaults={
                    'username': manager_email.split('@')[0],
                    'display_name': f"{company_data['name']} Manager",
                    'user_role': 'manager',
                    'is_active': True,
                    'is_email_verified': True
                }
            )
            
            if created:
                self.stdout.write(f'✅ Created manager: {manager.email}')
            
            # Create company
            company, created = Company.objects.get_or_create(
                name=company_data['name'],
                defaults={
                    'description': company_data['description'],
                    'manager': manager,
                    'max_users': company_data['max_users'],
                    'primary_color': company_data['primary_color'],
                    'is_active': True
                }
            )
            
            if created:
                self.stdout.write(f'✅ Created company: {company.name}')
                
                # Add manager as company user
                CompanyUser.objects.get_or_create(
                    company=company,
                    user=manager,
                    defaults={
                        'role': 'manager',
                        'is_active': True
                    }
                )
            else:
                self.stdout.write(f'✅ Using existing company: {company.name}')

    def create_sample_users(self):
        """Create sample users for each company"""
        self.stdout.write('\n👥 Creating sample users...')
        
        companies = Company.objects.filter(is_active=True, deleted_at__isnull=True)
        
        for company in companies:
            # Create 5 users for each company
            for i in range(1, 6):
                user_email = f"user{i}@{company.name.lower().replace(' ', '')}.com"
                user, created = User.objects.get_or_create(
                    email=user_email,
                    defaults={
                        'username': f"user{i}_{company.name.lower().replace(' ', '')}",
                        'display_name': f"User {i}",
                        'first_name': f"User",
                        'last_name': f"{i}",
                        'user_role': 'staff',
                        'is_active': True,
                        'is_email_verified': True,
                        'primary_company': company
                    }
                )
                
                if created:
                    self.stdout.write(f'✅ Created user: {user.email} for {company.name}')

    def setup_company_users(self):
        """Set up company-user relationships"""
        self.stdout.write('\n🔗 Setting up company-user relationships...')
        
        companies = Company.objects.filter(is_active=True, deleted_at__isnull=True)
        
        for company in companies:
            # Get users for this company
            company_users = User.objects.filter(
                primary_company=company,
                is_active=True
            )
            
            for user in company_users:
                # Create company user relationship
                company_user, created = CompanyUser.objects.get_or_create(
                    company=company,
                    user=user,
                    defaults={
                        'role': 'staff',
                        'is_active': True,
                        'company_display_name': user.display_name,
                        'company_role_title': f"Staff Member at {company.name}"
                    }
                )
                
                if created:
                    self.stdout.write(f'✅ Added {user.email} to {company.name}')

    def print_system_summary(self):
        """Print a summary of the company system"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('📋 Company System Summary')
        self.stdout.write('='*60)
        
        # Company statistics
        companies = Company.objects.filter(is_active=True, deleted_at__isnull=True)
        self.stdout.write(f'🏢 Total Companies: {companies.count()}')
        
        for company in companies:
            user_count = company.get_user_count()
            self.stdout.write(f'   • {company.name}: {user_count} users (max: {company.max_users})')
            self.stdout.write(f'     Manager: {company.manager.email}')
        
        # User statistics
        total_users = User.objects.filter(is_active=True).count()
        self.stdout.write(f'\n👥 Total Users: {total_users}')
        
        # Role breakdown
        role_counts = {}
        for role, _ in User.USER_ROLE_CHOICES:
            count = User.objects.filter(user_role=role, is_active=True).count()
            if count > 0:
                role_counts[role] = count
        
        self.stdout.write('\n📊 User Role Breakdown:')
        for role, count in role_counts.items():
            self.stdout.write(f'   • {role.title()}: {count}')
        
        # Company user relationships
        company_user_count = CompanyUser.objects.filter(is_active=True, deleted_at__isnull=True).count()
        self.stdout.write(f'\n🔗 Company-User Relationships: {company_user_count}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('✅ Company-based user management system is ready!')
        self.stdout.write('='*60)
        
        # Usage instructions
        self.stdout.write('\n📖 Usage Instructions:')
        self.stdout.write('1. Admin users can see all companies and users')
        self.stdout.write('2. Manager users can only see their own companies and users')
        self.stdout.write('3. Staff and Guest users can only see users in their companies')
        self.stdout.write('4. Use the API endpoints to manage companies and users:')
        self.stdout.write('   • GET /api/companies/ - List companies')
        self.stdout.write('   • POST /api/companies/ - Create company')
        self.stdout.write('   • GET /api/companies/{id}/users/ - List company users')
        self.stdout.write('   • POST /api/companies/{id}/users/ - Add user to company')
        
        self.stdout.write('\n🎯 Test the system:')
        self.stdout.write('1. Login as a manager to see only their company users')
        self.stdout.write('2. Login as admin to see all companies and users')
        self.stdout.write('3. Try creating new companies and adding users')

