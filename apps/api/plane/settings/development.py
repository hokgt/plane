"""
Development settings for Plane
Disables magic code authentication and other production features
"""

from .production import *

# Override production settings for development
DEBUG = True

# Disable magic link authentication for development
ENABLE_MAGIC_LINK_LOGIN = False

# Auto-verify emails in development
EMAIL_VERIFICATION_REQUIRED = False

# Disable email sending in development (optional)
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Development-specific settings
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Disable CSRF for development (be careful in production)
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

# Development logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'plane': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

