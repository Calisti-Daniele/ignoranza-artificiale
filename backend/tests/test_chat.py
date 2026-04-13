"""
Tests for the chat streaming endpoint.
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.mark.asyncio
async def test_chat_missing_session_id_returns_400(client: AsyncClient):
    """Test that missing X-Session-ID header returns 400."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={
            "message": "Hello",
        },
        headers={},  # No X-Session-ID
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "SESSION_ID_MISSING"


@pytest.mark.asyncio
async def test_chat_invalid_session_id_returns_400(client: AsyncClient):
    """Test that invalid X-Session-ID header returns 400."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={
            "message": "Hello",
        },
        headers={"X-Session-ID": "invalid@#$%"},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["code"] == "SESSION_ID_INVALID"


@pytest.mark.asyncio
async def test_chat_missing_message_returns_422(client: AsyncClient):
    """Test that missing message field returns 422."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={},
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_empty_message_returns_422(client: AsyncClient):
    """Test that empty message returns 422."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={"message": ""},
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_message_too_long_returns_422(client: AsyncClient):
    """Test that oversized message returns 422."""
    long_message = "x" * 5000  # Max is 4000
    response = await client.post(
        "/api/v1/chat/stream",
        json={"message": long_message},
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_invalid_conversation_history_returns_422(client: AsyncClient):
    """Test that invalid conversation history returns 422."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={
            "message": "Hello",
            "conversation_history": [{"invalid": "structure"}],
        },
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_valid_request_structure(client: AsyncClient):
    """Test that valid chat request is structured correctly."""
    conversation_id = str(uuid4())
    payload = {
        "message": "Ciao!",
        "agent_slug": None,
        "conversation_history": [],
        "enabled_agent_slugs": None,
        "conversation_id": conversation_id,
    }
    # This should not fail validation, but may fail on API key or agents
    response = await client.post(
        "/api/v1/chat/stream",
        json=payload,
        headers={"X-Session-ID": "valid-session-123"},
    )
    # Check that it's not a validation error
    assert response.status_code != 422


@pytest.mark.asyncio
async def test_chat_enabled_agent_slugs_validation(client: AsyncClient):
    """Test enabled_agent_slugs must be a list if provided."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={
            "message": "Hello",
            "enabled_agent_slugs": "not-a-list",
        },
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_conversation_id_must_be_uuid(client: AsyncClient):
    """Test conversation_id must be valid UUID if provided."""
    response = await client.post(
        "/api/v1/chat/stream",
        json={
            "message": "Hello",
            "conversation_id": "not-a-uuid",
        },
        headers={"X-Session-ID": "valid-session-123"},
    )
    assert response.status_code == 422
