"""
Tests for custom middleware (security headers, body size limits).
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Test that security headers are present in response."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200

    headers = response.headers
    assert "content-security-policy" in headers
    assert "x-content-type-options" in headers
    assert "x-frame-options" in headers
    assert "referrer-policy" in headers


@pytest.mark.asyncio
async def test_csp_header_value(client: AsyncClient):
    """Test Content-Security-Policy header value."""
    response = await client.get("/api/v1/health")
    csp = response.headers.get("content-security-policy", "")
    assert "default-src 'none'" in csp
    assert "frame-ancestors 'none'" in csp


@pytest.mark.asyncio
async def test_x_frame_options_deny(client: AsyncClient):
    """Test X-Frame-Options is DENY."""
    response = await client.get("/api/v1/health")
    assert response.headers.get("x-frame-options") == "DENY"


@pytest.mark.asyncio
async def test_x_content_type_options_nosniff(client: AsyncClient):
    """Test X-Content-Type-Options is nosniff."""
    response = await client.get("/api/v1/health")
    assert response.headers.get("x-content-type-options") == "nosniff"


@pytest.mark.asyncio
async def test_referrer_policy(client: AsyncClient):
    """Test Referrer-Policy header."""
    response = await client.get("/api/v1/health")
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_large_payload_rejection(client: AsyncClient):
    """Test that oversized payloads are rejected."""
    # Create a payload larger than 1 MiB
    large_payload = {"message": "x" * (1_048_576 + 1)}

    response = await client.post(
        "/api/v1/chat/stream",
        json=large_payload,
        headers={"X-Session-ID": "test-session", "Content-Length": str(1_048_576 + 1)},
    )
    # Should be rejected by middleware before reaching handler
    assert response.status_code in [400, 413]
