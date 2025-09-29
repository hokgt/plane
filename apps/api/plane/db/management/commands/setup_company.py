#!/usr/bin/env python
"""
Django management command to set up companies and users
Usage: python manage.py setup_company
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from plane.db.models import Company, CompanyUser
import secrets
import string

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up companies and users for the company management system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--company-name',
            type=str,
            help='Name of the company to create',
            default='Default Company'
        )
        parser.add_argument(
            '--company-description',
            type=str,
            help='Description of the company',
            default='Default company setup'
        )
        parser.add_argument(
            '--manager-email',
            type=str,
            help='Email of the company manager',
            required=True
        )
        parser.add_argument(
            '--manager-name',
            type=str,
            help='Display name of the company manager',
            default='Company Manager'
        )
        parser.add_argument(
            '--max-users',
            type=int,
            help='Maximum number of users for the company',
            default=50
        )
        parser.add_argument(
            '--create-sample-users',
            action='store_true',
            help='Create sample users for the company'
        )

    def handle(self, *args, **options):
        company_name = options['company_name']
        company_description = options['company_description']
        manager_email = options['manager_email']
        manager_name = options['manager_name']
        max_users = options['max_users']
        create_sample_users = options['create_sample_users']

        self.stdout.write(
            self.style.SUCCESS(f'Setting up company: {company_name}')
        )

        try:
            with transaction.atomic():
                # Create or get company manager
                manager = self.create_or_get_manager(manager_email, manager_name)
                
                # Create company
                company = self.create_company(
                    company_name, 
                    company_description, 
                    manager, 
                    max_users
                )
                
                # Add manager to company
                self.add_manager_to_company(company, manager)
                
                # Create sample users if requested
                if create_sample_users:
                    self.create_sample_users(company)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created company "{company_name}" with manager {manager_email}'
                    )
                )
                
                self.display_company_info(company)

        except Exception as e:
            raise CommandError(f'Error setting up company: {str(e)}')

    def create_or_get_manager(self, email, display_name):
        """Create or get the company manager user"""
        try:
            manager = User.objects.get(email=email)
            self.stdout.write(
                self.style.WARNING(f'Manager {email} already exists, using existing user')
            )
            
            # Update manager role if needed
            if not manager.is_manager():
                manager.user_role = 'manager'
                manager.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated {email} to manager role')
                )
                
        except User.DoesNotExist:
            # Create new manager
            username = email.split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            # Generate temporary password
            temp_password = ''.join(
                secrets.choice(string.ascii_letters + string.digits) 
                for _ in range(12)
            )
            
            manager = User.objects.create(
                email=email,
                username=username,
                display_name=display_name,
                user_role='manager',
                is_active=True,
                is_password_autoset=True,
            )
            manager.set_password(temp_password)
            manager.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Created new manager: {email}')
            )
            self.stdout.write(
                self.style.WARNING(f'Temporary password: {temp_password}')
            )
        
        return manager

    def create_company(self, name, description, manager, max_users):
        """Create a new company"""
        # Generate slug from name
        base_slug = name.lower().replace(' ', '-').replace('_', '-')
        slug = base_slug
        
        # Ensure slug is unique
        counter = 1
        while Company.objects.filter(slug=slug, deleted_at__isnull=True).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        company = Company.objects.create(
            name=name,
            description=description,
            slug=slug,
            manager=manager,
            max_users=max_users,
            is_active=True
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created company: {name} (slug: {slug})')
        )
        
        return company

    def add_manager_to_company(self, company, manager):
        """Add manager to company with manager role"""
        company_user, created = CompanyUser.objects.get_or_create(
            company=company,
            user=manager,
            defaults={
                'role': 'manager',
                'is_active': True,
                'company_display_name': manager.display_name
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Added {manager.email} as company manager')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'{manager.email} already in company')
            )
        
        # Update manager's primary company
        if not manager.primary_company:
            manager.primary_company = company
            manager.save()
            self.stdout.write(
                self.style.SUCCESS(f'Set {company.name} as primary company for {manager.email}')
            )

    def create_sample_users(self, company):
        """Create sample users for the company"""
        sample_users = [
            {
                'email': f'developer1@{company.slug}.com',
                'display_name': 'John Developer',
                'first_name': 'John',
                'last_name': 'Developer',
                'role': 'staff',
                'company_role_title': 'Senior Developer'
            },
            {
                'email': f'designer1@{company.slug}.com',
                'display_name': 'Jane Designer',
                'first_name': 'Jane',
                'last_name': 'Designer',
                'role': 'staff',
                'company_role_title': 'UI/UX Designer'
            },
            {
                'email': f'guest1@{company.slug}.com',
                'display_name': 'Guest User',
                'first_name': 'Guest',
                'last_name': 'User',
                'role': 'guest',
                'company_role_title': 'Guest'
            }
        ]
        
        for user_data in sample_users:
            self.create_sample_user(company, user_data)

    def create_sample_user(self, company, user_data):
        """Create a sample user and add to company"""
        try:
            # Check if user already exists
            user = User.objects.get(email=user_data['email'])
            self.stdout.write(
                self.style.WARNING(f'User {user_data["email"]} already exists, skipping')
            )
            return
            
        except User.DoesNotExist:
            # Create new user
            username = user_data['email'].split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            
            # Generate temporary password
            temp_password = ''.join(
                secrets.choice(string.ascii_letters + string.digits) 
                for _ in range(12)
            )
            
            user = User.objects.create(
                email=user_data['email'],
                username=username,
                display_name=user_data['display_name'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                user_role='staff',
                primary_company=company,
                is_active=True,
                is_password_autoset=True,
            )
            user.set_password(temp_password)
            user.save()
            
            # Add user to company
            CompanyUser.objects.create(
                company=company,
                user=user,
                role=user_data['role'],
                company_display_name=user_data['display_name'],
                company_role_title=user_data['company_role_title'],
                is_active=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created user: {user_data["email"]} '
                    f'({user_data["role"]}) - Password: {temp_password}'
                )
            )

    def display_company_info(self, company):
        """Display company information"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('COMPANY SETUP COMPLETE'))
        self.stdout.write('='*50)
        self.stdout.write(f'Company Name: {company.name}')
        self.stdout.write(f'Company Slug: {company.slug}')
        self.stdout.write(f'Manager: {company.manager.email}')
        self.stdout.write(f'Max Users: {company.max_users}')
        self.stdout.write(f'Current Users: {company.get_user_count()}')
        self.stdout.write('\nCompany Users:')
        
        for company_user in company.get_company_users():
            self.stdout.write(
                f'  - {company_user.user.email} '
                f'({company_user.role}) - '
                f'{company_user.company_role_title or "No title"}'
            )
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(
            self.style.SUCCESS('You can now access the company management system!')
        )
        self.stdout.write('='*50)
