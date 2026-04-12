"""
GET /api/v1/agents — returns the full list of active AI agents.

Data is served from the in-memory AGENTS registry (populated at startup).
No DB query is performed.
"""

import logging
from typing import Annotated

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request

from app.core.agent_registry import AGENTS
from app.core.dependencies import get_redis, get_session_id
from app.schemas.agents import AgentPublic, AgentsListResponse
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["agents"])

_ENDPOINT_KEY = "agents"
_SESSION_LIMIT = 60
_IP_LIMIT = 60


@router.get("", response_model=AgentsListResponse)
async def list_agents(
    request: Request,
    session_id: Annotated[str, Depends(get_session_id)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
) -> AgentsListResponse:
    """
    Return all active agents from the in-memory registry.

    Rate limits:
    - 60 req / 60 s per session
    - 60 req / 60 s per IP
    """
    client_ip = request.client.host if request.client else "unknown"
    await rate_limiter.check_rate_limit(
        session_id=session_id,
        client_ip=client_ip,
        redis=redis,
        endpoint_key=_ENDPOINT_KEY,
        session_limit=_SESSION_LIMIT,
        ip_limit=_IP_LIMIT,
    )

    agents = [
        AgentPublic(
            slug=agent.slug,
            name=agent.name,
            vibe_label=agent.vibe_label,
            color_hex=agent.color_hex,
            contributor_github=agent.contributor_github,
            contributor_name=agent.contributor_name,
            persona_summary=agent.persona_summary,
        )
        for agent in AGENTS.values()
    ]

    logger.debug("Restituzione di %d agenti.", len(agents))
    return AgentsListResponse(agents=agents)
