"""
Redis-based dual-layer rate limiter using an atomic Lua fixed-window counter.

Algorithm: FIXED-WINDOW COUNTER (intentional design choice, risk accepted).
---------------------------------------------------------------------------
The Lua script performs INCR on the key and sets EXPIRE only when the key is
created (count == 1).  This means the window is fixed: it starts at the first
request and resets after RATE_LIMIT_WINDOW_SECONDS seconds, regardless of when
subsequent requests arrive.

Known trade-off: at window boundaries an attacker can fire up to 2× the
configured limit within a short period (e.g., burst at the end of window N
followed immediately by a burst at the start of window N+1).  For this project
the simplicity and atomicity of the approach outweigh the boundary-burst risk.
A true sliding window (Redis sorted sets / ZADD+ZREMRANGEBYSCORE+ZCARD) is the
recommended upgrade path if stricter enforcement becomes necessary.

The INCR+EXPIRE pattern is atomic with respect to key creation: if the server
crashes between INCR and EXPIRE on a brand-new key the key survives without a
TTL and the rate limit becomes permanent.  The Lua script avoids this race by
only calling EXPIRE when count == 1.  evalsha() is used after script loading to
avoid re-sending the script on every call.

Layers:
1. Session-based (per X-Session-ID)  — configurable via RATE_LIMIT_REQUESTS / RATE_LIMIT_WINDOW_SECONDS
2. IP-based (hard ceiling)            — configurable via RATE_LIMIT_REQUESTS / RATE_LIMIT_WINDOW_SECONDS
"""

import logging

import redis.asyncio as aioredis
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lua fixed-window script (atomic INCR + EXPIRE on new key).
# Returns the current request count AFTER increment.
# ---------------------------------------------------------------------------
_LUA_FIXED_WINDOW = """
local key     = KEYS[1]
local window  = tonumber(ARGV[1])
local count   = redis.call('INCR', key)
if count == 1 then
    redis.call('EXPIRE', key, window)
end
return count
"""


class RateLimiter:
    """
    Dual-layer (session + IP) rate limiter backed by Redis.

    Usage in a FastAPI route:
        limiter = RateLimiter()
        await limiter.check_rate_limit(session_id, client_ip, redis_client, endpoint_key)
    """

    def __init__(self) -> None:
        self._sha: str | None = None

    async def _get_sha(self, redis: aioredis.Redis) -> str:
        """Load the Lua script into Redis and cache the SHA1 hash."""
        if self._sha is None:
            self._sha = await redis.script_load(_LUA_FIXED_WINDOW)
        return self._sha

    async def _check_layer(
        self,
        redis: aioredis.Redis,
        key: str,
        limit: int,
        window: int,
    ) -> int:
        """
        Atomically increment the counter for `key` and return the new count.

        Falls back to EVAL if the cached SHA is no longer in Redis (e.g. after flush).
        """
        sha = await self._get_sha(redis)
        try:
            count: int = await redis.evalsha(sha, 1, key, window)
        except aioredis.ResponseError:
            # SHA not found in Redis — reload and retry once.
            self._sha = None
            sha = await self._get_sha(redis)
            count = await redis.evalsha(sha, 1, key, window)
        return count

    async def check_rate_limit(
        self,
        session_id: str,
        client_ip: str,
        redis: aioredis.Redis,
        endpoint_key: str,
        session_limit: int | None = None,
        ip_limit: int | None = None,
        window: int | None = None,
    ) -> None:
        """
        Check both rate-limit layers.  Raises HTTPException(429) if either is exceeded.

        Args:
            session_id:    Value of X-Session-ID header.
            client_ip:     Client IP address from request.client.host.
            redis:         Async Redis client.
            endpoint_key:  Short string identifying the endpoint (e.g. "chat", "shame").
            session_limit: Per-session request cap. Defaults to settings.RATE_LIMIT_REQUESTS.
            ip_limit:      Per-IP hard ceiling. Defaults to settings.RATE_LIMIT_REQUESTS * 3.
            window:        Sliding window in seconds. Defaults to settings.RATE_LIMIT_WINDOW_SECONDS.
        """
        effective_window = window if window is not None else settings.RATE_LIMIT_WINDOW_SECONDS
        effective_session_limit = session_limit if session_limit is not None else settings.RATE_LIMIT_REQUESTS
        effective_ip_limit = ip_limit if ip_limit is not None else settings.RATE_LIMIT_REQUESTS * 3

        session_key = f"ratelimit:{session_id}:{endpoint_key}"
        ip_key = f"ratelimit:{client_ip}:{endpoint_key}"

        # Layer 1 — session-based.
        session_count = await self._check_layer(redis, session_key, effective_session_limit, effective_window)
        if session_count > effective_session_limit:
            logger.warning(
                "Rate limit superato (session): session_id='%s' endpoint='%s' count=%d limit=%d",
                session_id,
                endpoint_key,
                session_count,
                effective_session_limit,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": str(effective_window)},
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Hai fatto troppe richieste. Riprova tra {effective_window} secondi.",
                    "retry_after_seconds": effective_window,
                },
            )

        # Layer 2 — IP-based hard ceiling.
        ip_count = await self._check_layer(redis, ip_key, effective_ip_limit, effective_window)
        if ip_count > effective_ip_limit:
            logger.warning(
                "Rate limit superato (IP): ip='%s' endpoint='%s' count=%d limit=%d",
                client_ip,
                endpoint_key,
                ip_count,
                effective_ip_limit,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": str(effective_window)},
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Troppo traffico dal tuo indirizzo. Riprova tra {effective_window} secondi.",
                    "retry_after_seconds": effective_window,
                },
            )


# Module-level singleton — created once and reused across requests.
rate_limiter = RateLimiter()
