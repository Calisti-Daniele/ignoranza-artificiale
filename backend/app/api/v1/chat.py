"""
POST /api/v1/chat/stream — real-time SSE chat endpoint.

All validation (rate limit, session ID, API key, agent slug) runs BEFORE the
StreamingResponse generator starts, so failures return standard JSON error bodies.

SSE event contract (media_type="text/event-stream"):
  Each line is:  data: <json>\n\n

  Event types:
    agent_selected  — emitted once, immediately after routing
    token           — one per streamed text chunk
    done            — final event; carries conversation_id and total_tokens
    error           — emitted on upstream LLM failure; stream ends after this
"""

from __future__ import annotations

import logging
from typing import Annotated, AsyncGenerator

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.agent_registry import AGENTS
from app.core.dependencies import get_openrouter_key, get_redis, get_session_id
from app.schemas.chat import ChatRequest
from app.services.chat_service import stream_chat_response
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

# Rate limit thresholds for the chat endpoint (more restrictive than agents list).
_ENDPOINT_KEY = "chat"
_SESSION_LIMIT = 10
_IP_LIMIT = 30


@router.post(
    "/stream",
    summary="Stream a chat response from an AI agent",
    response_description="Server-Sent Events stream (text/event-stream)",
    status_code=status.HTTP_200_OK,
    # FastAPI cannot infer the SSE schema; document manually in OpenAPI.
    responses={
        200: {"content": {"text/event-stream": {}}},
        400: {"description": "Missing or invalid X-Session-ID / agent_slug"},
        404: {"description": "Agent not found"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Server misconfiguration (missing API key)"},
    },
)
async def chat_stream(
    request: Request,
    body: ChatRequest,
    session_id: Annotated[str, Depends(get_session_id)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    api_key: Annotated[str, Depends(get_openrouter_key)],
) -> StreamingResponse:
    """
    Stream a response from an AI agent using Server-Sent Events.

    All pre-stream validation executes synchronously so that errors are returned
    as standard JSON bodies (not SSE events), which is what the client expects
    before the stream begins.

    Rate limits:
    - 10 req / 60 s per session
    - 30 req / 60 s per IP
    """
    client_ip = request.client.host if request.client else "unknown"

    # ------------------------------------------------------------------
    # Pre-stream validation (all must succeed before generator starts).
    # ------------------------------------------------------------------

    # 1. Rate limit check
    await rate_limiter.check_rate_limit(
        session_id=session_id,
        client_ip=client_ip,
        redis=redis,
        endpoint_key=_ENDPOINT_KEY,
        session_limit=_SESSION_LIMIT,
        ip_limit=_IP_LIMIT,
    )

    # 2. Validate agent_slug if explicitly provided
    if body.agent_slug is not None:
        if body.agent_slug not in AGENTS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "AGENT_NOT_FOUND",
                    "message": f"L'agente '{body.agent_slug}' non esiste.",
                    "retry_after_seconds": None,
                },
            )

    # 3. Guard against empty registry (should not happen post-startup, but be safe)
    if not AGENTS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "NO_AGENTS_AVAILABLE",
                "message": "Nessun agente disponibile. Riprova tra qualche istante.",
                "retry_after_seconds": 10,
            },
        )

    # ------------------------------------------------------------------
    # Build the SSE generator — validation is complete, so all errors
    # from this point onward are emitted as SSE error events inside the stream.
    # ------------------------------------------------------------------
    async def _generator() -> AsyncGenerator[str, None]:
        async for event in stream_chat_response(
            session_id=session_id,
            message=body.message,
            agent_slug=body.agent_slug,
            conversation_history=body.conversation_history,
            conversation_id=body.conversation_id,
            api_key=api_key,
            redis=redis,
        ):
            yield event

    return StreamingResponse(
        _generator(),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
