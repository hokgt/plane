import redis
from django.conf import settings
from urllib.parse import urlparse


def redis_instance():
    # connect to redis
    if not settings.REDIS_URL:
        # Return a dummy Redis instance if no URL is configured
        return None
    
    if settings.REDIS_SSL:
        url = urlparse(settings.REDIS_URL)
        ri = redis.Redis(
            host=url.hostname,
            port=url.port,
            password=url.password,
            ssl=True,
            ssl_cert_reqs=None,
        )
    else:
        ri = redis.Redis.from_url(settings.REDIS_URL, db=0)

    return ri
