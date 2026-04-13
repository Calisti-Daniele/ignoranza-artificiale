"""
Tests for the health check endpoint.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_returns_200(client: AsyncClient):
    """Test that health check endpoint returns 200 OK."""
    response = await client.get("/api/v1/health", headers={"Host": "localhost"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_check_returns_ok_status(client: AsyncClient):
    """Test that health check returns correct status field."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["status"] == "ok"
