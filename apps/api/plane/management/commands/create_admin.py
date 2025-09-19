from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from plane.db.models import Profile

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Admin email')
        parser.add_argument('--username', type=str, required=True, help='Admin username')
        parser.add_argument('--password', type=str, required=True, help='Admin password')
        parser.add_argument('--first-name', type=str, default='', help='First name')
        parser.add_argument('--last-name', type=str, default='', help='Last name')

    def handle(self, *args, **options):
        email = options['email']
        username = options['username']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User with username {username} already exists')
            )
            return

        # Create admin user
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_role='admin',
            is_active=True,
            is_email_verified=True,
        )

        # Create user profile
        Profile.objects.create(
            user=user,
            is_onboarded=True,
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user: {email}')
        )
