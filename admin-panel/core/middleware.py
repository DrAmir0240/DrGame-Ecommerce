"""Middleware to dynamically trust request origins and prevent CSRF failures behind proxies or arbitrary IPs/domains."""
from django.conf import settings


class DynamicCsrfTrustedOriginMiddleware:
    """
    Ensures that any request with an Origin header (or matching the current Host)
    is dynamically trusted in CSRF_TRUSTED_ORIGINS.
    This prevents 403 Forbidden CSRF origin verification errors when Django Admin
    is accessed via Server IP (e.g. 62.60.191.67:8007), custom domains, or reverse proxies.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        if origin:
            if origin not in settings.CSRF_TRUSTED_ORIGINS:
                settings.CSRF_TRUSTED_ORIGINS.append(origin)
        else:
            host = request.get_host()
            if host:
                scheme = "https" if request.is_secure() else "http"
                constructed_origin = f"{scheme}://{host}"
                if constructed_origin not in settings.CSRF_TRUSTED_ORIGINS:
                    settings.CSRF_TRUSTED_ORIGINS.append(constructed_origin)

        return self.get_response(request)
