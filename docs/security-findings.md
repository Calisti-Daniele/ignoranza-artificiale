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
**Status:** Partially mitigated — middleware docstring updated to document Nginx as the primary enforcement layer; the middleware is now explicitly described as second line of defense for direct-container access.

### RESOLVED (HIGH / MEDIUM)

| ID | Finding | Fixed in |
|----|---------|----------|
| H1 | Redis key injection via unvalidated X-Session-ID | Phase 3 |
| H2 | Redis connection created per-request (no pool) | Phase 3 |
| H3 | Backend Dockerfile single-stage | Phase 3 |
| M2 | ALLOWED_HOSTS Defaults to Wildcard | Phase 6 prep |
| M3 | Docker Bind Mount Overrides Container Security | Phase 6 prep |
| M4 | OpenAPI/Swagger Docs Always Exposed | Phase 6 prep |
| M5 | No Content-Security-Policy Header | Phase 6 prep |

---

## Phase 4 Audit — 2026-04-13

**Auditor:** @security-auditor (Opus)
**Verdict:** CONDITIONALLY APPROVED (after H-1/H-2 fixes)

### MEDIUM

### RESOLVED (HIGH / MEDIUM)

| ID | Finding | Fixed in |
|----|---------|----------|
| H-1 | No `max_tokens` on LLM calls — runaway generation possible | Phase 4 (routing: 30, streaming: 2048) |
| H-2 | No timeouts on upstream LLM calls — worker could block indefinitely | Phase 4 (routing: 10s, streaming: 120s via `asyncio.timeout`) |
| M1 | No IP fallback for clients behind reverse proxy | Phase 6 prep |
| M2 | Rate limiter is fixed-window, not sliding-window (docstring fix, risk accepted) | Phase 6 prep |
| M3 | Stale empty file `backend/app/core/rate_limiter.py` deleted | Phase 6 prep |

---

## Phase 5 Audit — 2026-04-13

**Auditor:** @security-auditor (Opus) — Runtime finding during frontend integration
**Verdict:** PASS (after M1 fix)

### RESOLVED (MEDIUM)

| ID | Finding | Fixed in |
|----|---------|----------|
| M1 | CSP `script-src` allows `'unsafe-inline'` — replaced with nonce-based CSP via `frontend/src/middleware.ts` | Phase 6 prep |
