from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Promote an existing user to admin'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='User email')
        parser.add_argument('--username', type=str, help='Username')
        parser.add_argument('--user-id', type=str, help='User ID')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')
        user_id = options.get('user_id')

        # Find user by provided identifier
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {user_id} not found')
                )
                return
        elif email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with email {email} not found')
                )
                return
        elif username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with username {username} not found')
                )
                return
        else:
            self.stdout.write(
                self.style.ERROR('Please provide either --email, --username, or --user-id')
            )
            return

        # Promote to admin
        user.user_role = 'admin'
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully promoted {user.email} to admin')
        )
