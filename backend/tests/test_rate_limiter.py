"""
Tests for the rate limiter service.
"""

import pytest
from fastapi import HTTPException
from app.services.rate_limiter import rate_limiter


@pytest.mark.asyncio
async def test_rate_limiter_allows_first_request(mock_redis):
    """Test that first request passes rate limit check."""
    try:
        await rate_limiter.check_rate_limit(
            session_id="test-session",
            client_ip="127.0.0.1",
            redis=mock_redis,
            endpoint_key="test",
            session_limit=10,
            ip_limit=30,
        )
        # Should not raise
        assert True
    except HTTPException:
        pytest.fail("First request should not be rate limited")


@pytest.mark.asyncio
async def test_rate_limiter_blocks_session_overload(mock_redis):
    """Test that session limit is enforced."""
    session_id = "test-session-limit"
    client_ip = "127.0.0.1"

    # Make 11 requests to a limit of 10
    for i in range(10):
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=10,
            ip_limit=30,
        )

    # 11th request should fail
    with pytest.raises(HTTPException) as exc_info:
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=10,
            ip_limit=30,
        )
    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_rate_limiter_blocks_ip_overload(mock_redis):
    """Test that IP limit is enforced."""
    client_ip = "192.168.1.1"

    # Make 31 requests to IP limit of 30 (using different sessions)
    for i in range(30):
        await rate_limiter.check_rate_limit(
            session_id=f"session-{i}",
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=100,  # High session limit
            ip_limit=30,
        )

    # 31st request should fail
    with pytest.raises(HTTPException) as exc_info:
        await rate_limiter.check_rate_limit(
            session_id="session-final",
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=100,
            ip_limit=30,
        )
    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_rate_limiter_different_endpoints_separate(mock_redis):
    """Test that different endpoints have separate rate limit counters."""
    session_id = "test-session"
    client_ip = "127.0.0.1"

    # Fill up rate limit for "endpoint1"
    for i in range(10):
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="endpoint1",
            session_limit=10,
            ip_limit=30,
        )

    # Should fail on endpoint1
    with pytest.raises(HTTPException):
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="endpoint1",
            session_limit=10,
            ip_limit=30,
        )

    # But should work on endpoint2 (different counter)
    try:
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="endpoint2",
            session_limit=10,
            ip_limit=30,
        )
        assert True
    except HTTPException:
        pytest.fail("endpoint2 should have separate rate limit counter")


@pytest.mark.asyncio
async def test_rate_limiter_error_detail_structure(mock_redis):
    """Test that rate limit error has correct detail structure."""
    session_id = "test-session"
    client_ip = "127.0.0.1"

    # Exceed limit
    for i in range(5):
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=5,
            ip_limit=30,
        )

    with pytest.raises(HTTPException) as exc_info:
        await rate_limiter.check_rate_limit(
            session_id=session_id,
            client_ip=client_ip,
            redis=mock_redis,
            endpoint_key="test",
            session_limit=5,
            ip_limit=30,
        )

    exc = exc_info.value
    assert exc.status_code == 429
    assert "code" in exc.detail
    assert "message" in exc.detail
    assert "retry_after_seconds" in exc.detail
