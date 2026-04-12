# Security Findings

Tracked findings from security audits. CRITICAL and HIGH findings must be resolved before merge. MEDIUM findings are sprint-level follow-ups.

---

## Phase 3 Audit — 2026-04-13

**Auditor:** @security-auditor (Opus)
**Verdict:** PASS (after H1/H2/H3 fixes)

### MEDIUM

#### M1 — ContentSizeLimitMiddleware Bypassed by Chunked Transfer Encoding
**File:** `backend/app/core/middleware.py`
**Problem:** The middleware only inspects the `Content-Length` header. HTTP/1.1 `Transfer-Encoding: chunked` requests do not include `Content-Length`, so they bypass the 1 MiB body limit entirely.
**Recommendation:** Read and count the body stream up to the limit, rejecting if it exceeds `_MAX_BODY_SIZE`. Alternatively, enforce the limit at the reverse proxy (Nginx/Traefik) layer and document the middleware as defense-in-depth only for sized requests.

#### M2 — ALLOWED_HOSTS Defaults to Wildcard
**File:** `backend/app/core/config.py`
**Problem:** `ALLOWED_HOSTS: list[str] = ["*"]` — if the env var is not set, `TrustedHostMiddleware` accepts any `Host` header, enabling host header injection attacks in production.
**Recommendation:** Remove the default or set it to an empty list. Add a warning in `.env.example` that `ALLOWED_HOSTS` must be explicitly set in production.

#### M3 — Docker Bind Mount Overrides Container Security
**File:** `docker-compose.yml`
**Problem:** `volumes: - ./backend:/app` in the backend service overwrites the entire `/app` directory at runtime, nullifying the `chown` from the Dockerfile and exposing all host files (including `.env`) directly inside the container.
**Recommendation:** Create a `docker-compose.prod.yml` (or use `docker-compose.override.yml`) that does NOT include the bind mount. The bind mount should exist only in the dev override.

#### M4 — OpenAPI/Swagger Docs Always Exposed
**File:** `backend/app/main.py`
**Problem:** `docs_url`, `redoc_url`, and `openapi_url` are always enabled, exposing the full API schema to anyone in production.
**Recommendation:** Gate docs behind an env variable (e.g., `DOCS_ENABLED: bool = True`) and disable in production.

#### M5 — No Content-Security-Policy Header
**File:** `backend/app/core/middleware.py`
**Problem:** `SecurityHeadersMiddleware` sets several security headers but omits `Content-Security-Policy`. Low-risk for a JSON API, but relevant if any HTML is ever served (error pages, docs).
**Recommendation:** Add `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` to the middleware.

### RESOLVED (HIGH)

| ID | Finding | Fixed in |
|----|---------|----------|
| H1 | Redis key injection via unvalidated X-Session-ID | Phase 3 |
| H2 | Redis connection created per-request (no pool) | Phase 3 |
| H3 | Backend Dockerfile single-stage | Phase 3 |

---

## Phase 4 Audit — 2026-04-13

**Auditor:** @security-auditor (Opus)
**Verdict:** CONDITIONALLY APPROVED (after H-1/H-2 fixes)

### MEDIUM

#### M1 — No IP fallback for clients behind reverse proxy
**File:** `backend/app/api/v1/chat.py:74`
**Problem:** `request.client.host` falls back to `"unknown"` when `request.client` is `None` (common behind proxies/Unix sockets). All unknown clients share a single rate-limit bucket, enabling either starvation of legitimate traffic or bypass by a single attacker.
**Recommendation:** Read a trusted header (`X-Forwarded-For`) via `ProxyHeadersMiddleware` with `trusted_hosts` configured. If no IP can be resolved, reject the request instead of collapsing to a shared key.

#### M2 — Rate limiter is fixed-window, not sliding-window
**File:** `backend/app/services/rate_limiter.py`
**Problem:** The Lua script uses `INCR` + `EXPIRE` on first hit — this is a fixed-window counter. At window boundaries an attacker can fire 2× the intended limit (e.g. 10 at T−1s + 10 at T+1s = 20 in 2s against a 10/60s limit).
**Recommendation:** Either update the docstring to "fixed-window" (acceptable risk for this project) or implement a true sliding window using Redis sorted sets (`ZADD` / `ZREMRANGEBYSCORE` / `ZCARD`).

#### M3 — Stale empty file in `core/rate_limiter.py`
**File:** `backend/app/core/rate_limiter.py`
**Problem:** Contains only a 6-line docstring with no implementation. The actual rate limiter lives at `backend/app/services/rate_limiter.py`. The stale file causes import path confusion and misleads developers into thinking rate limiting may not be implemented.
**Recommendation:** Delete `backend/app/core/rate_limiter.py`.

### RESOLVED (HIGH)

| ID | Finding | Fixed in |
|----|---------|----------|
| H-1 | No `max_tokens` on LLM calls — runaway generation possible | Phase 4 (routing: 30, streaming: 2048) |
| H-2 | No timeouts on upstream LLM calls — worker could block indefinitely | Phase 4 (routing: 10s, streaming: 120s via `asyncio.timeout`) |
