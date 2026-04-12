"""
GET /api/v1/health — liveness probe.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: str


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Simple liveness check — returns 200 OK if the server is up."""
    return HealthResponse(status="ok")
