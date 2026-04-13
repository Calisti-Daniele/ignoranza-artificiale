"""
Custom ASGI middleware for the application.

SecurityHeadersMiddleware — appends security-related HTTP response headers.
ContentSizeLimitMiddleware — rejects request bodies larger than 1 MiB (1_048_576 bytes).
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger(__name__)

_MAX_BODY_SIZE: int = 1_048_576  # 1 MiB


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends security headers to every response.

    Strict-Transport-Security is only emitted when settings.HTTPS_ENABLED is True
    to avoid browser HSTS preloading issues in local HTTP development.
    """

    async def dispatch(self, request: Request, call_next: "Callable") -> Response:  # type: ignore[name-defined]
        response: Response = await call_next(request)
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.HTTPS_ENABLED:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


class ContentSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Rejects requests whose Content-Length header exceeds 1 MiB.

    Only inspects the Content-Length header (does not read the body stream).
    Nginx is expected to enforce the same limit upstream; this middleware is
    the second line of defence for direct-container access.
    """

    async def dispatch(self, request: Request, call_next: "Callable") -> Response:  # type: ignore[name-defined]
        content_length_raw = request.headers.get("content-length")
        if content_length_raw is not None:
            try:
                content_length = int(content_length_raw)
            except ValueError:
                content_length = 0

            if content_length > _MAX_BODY_SIZE:
                logger.warning(
                    "Richiesta rifiutata: Content-Length=%d supera il limite di %d byte. IP=%s",
                    content_length,
                    _MAX_BODY_SIZE,
                    request.client.host if request.client else "unknown",
                )
                return Response(
                    content='{"detail": {"code": "PAYLOAD_TOO_LARGE", "message": "Il corpo della richiesta supera il limite di 1 MB.", "retry_after_seconds": null}}',
                    status_code=413,
                    media_type="application/json",
                )
        return await call_next(request)
