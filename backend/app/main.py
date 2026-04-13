"""
FastAPI application entry point.

Middleware order (outermost → innermost):
1. CORSMiddleware          — must be first per FastAPI docs
2. TrustedHostMiddleware   — rejects requests with unexpected Host headers
3. ContentSizeLimitMiddleware — rejects bodies > 1 MiB before parsing
4. SecurityHeadersMiddleware  — appends security response headers

All routers are mounted under /api/v1.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.agent_registry import load_agents_from_yaml
from app.core.config import settings
from app.core.dependencies import get_redis_pool
from app.core.middleware import ContentSizeLimitMiddleware, SecurityHeadersMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager — replaces deprecated @app.on_event."""
    logger.info("Avvio applicazione — caricamento agenti in corso...")
    load_agents_from_yaml()
    logger.info("Avvio completato.")
    yield
    logger.info("Spegnimento applicazione.")
    # Gracefully drain and close the shared Redis connection pool.
    pool = get_redis_pool()
    await pool.aclose()
    logger.info("Redis connection pool chiuso.")


app = FastAPI(
    title="Ignoranza Artificiale API",
    version="0.1.0",
    docs_url="/api/docs" if settings.DOCS_ENABLED else None,
    redoc_url="/api/redoc" if settings.DOCS_ENABLED else None,
    openapi_url="/api/openapi.json" if settings.DOCS_ENABLED else None,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware — registered in reverse order (last added = outermost layer).
# FastAPI/Starlette wraps middleware in a stack: the LAST add_middleware call
# becomes the outermost layer. CORS must be outermost → add it last.
# ---------------------------------------------------------------------------

# Layer 4 (innermost): Security headers
app.add_middleware(SecurityHeadersMiddleware)

# Layer 3: Body size limit
app.add_middleware(ContentSizeLimitMiddleware)

# Layer 2: Trusted host validation
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Layer 1 (outermost): CORS — MUST be the last add_middleware call.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Session-ID"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_v1_router)
