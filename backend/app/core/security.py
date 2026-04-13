"""
Security utilities for the FastAPI application.

get_client_ip — resolves the real client IP from a request, honouring the
                X-Forwarded-For header set by reverse proxies before falling
                back to the direct connection address.
"""

from starlette.requests import Request


def get_client_ip(request: Request) -> str | None:
    """
    Resolve the originating client IP address from a FastAPI/Starlette Request.

    Resolution order:
    1. ``X-Forwarded-For`` header — set by reverse proxies (Nginx, Traefik, AWS
       ALB, etc.).  Only the *first* address in the comma-separated list is used,
       as it represents the original client IP before any intermediate hops.
       NOTE: This header can be spoofed when the application is accessed directly
       (without a trusted proxy).  Ensure the proxy is the sole public entry
       point and strips or overwrites client-supplied XFF headers.
    2. ``request.client.host`` — the TCP-level peer address provided by the ASGI
       server.  Present for direct connections; may be ``None`` behind Unix-socket
       proxies or in certain test environments.
    3. ``None`` — returned when neither source yields an IP.  Callers MUST reject
       the request (HTTP 400) rather than fall back to a shared bucket that could
       be exploited for rate-limit bypass.

    Args:
        request: The incoming Starlette/FastAPI request object.

    Returns:
        A non-empty IP address string, or ``None`` if unresolvable.
    """
    xff: str | None = request.headers.get("X-Forwarded-For")
    if xff:
        first_ip = xff.split(",")[0].strip()
        if first_ip:
            return first_ip

    if request.client is not None and request.client.host:
        return request.client.host

    return None
