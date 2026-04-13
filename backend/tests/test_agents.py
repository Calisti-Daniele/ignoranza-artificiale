"""
Tests for the agents listing endpoint.
"""

import pytest
from httpx import AsyncClient
from app.core.agent_registry import AGENTS, AgentConfig


@pytest.mark.asyncio
async def test_agents_list_endpoint_returns_200(client: AsyncClient):
    """Test that agents list endpoint returns 200 OK."""
    response = await client.get("/api/v1/agents")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_agents_list_returns_agents_array(client: AsyncClient):
    """Test that agents list returns an array of agents."""
    response = await client.get("/api/v1/agents")
    data = response.json()
    assert "agents" in data
    assert isinstance(data["agents"], list)


@pytest.mark.asyncio
async def test_agents_list_agent_structure(client: AsyncClient):
    """Test that each agent has required fields."""
    response = await client.get("/api/v1/agents")
    data = response.json()
    agents = data.get("agents", [])

    if agents:
        agent = agents[0]
        required_fields = [
            "slug",
            "name",
            "vibe_label",
            "color_hex",
            "contributor_github",
            "contributor_name",
            "persona_summary",
        ]
        for field in required_fields:
            assert field in agent, f"Agent missing field: {field}"


@pytest.mark.asyncio
async def test_agents_list_includes_registry_agents(client: AsyncClient):
    """Test that listed agents match registry."""
    response = await client.get("/api/v1/agents")
    data = response.json()
    agents = data.get("agents", [])

    if AGENTS:
        # If agents are loaded, check that count matches
        assert len(agents) == len(AGENTS)

    # Verify slugs match registry
    agent_slugs = {agent["slug"] for agent in agents}
    registry_slugs = set(AGENTS.keys())
    assert agent_slugs == registry_slugs


@pytest.mark.asyncio
async def test_agents_list_has_valid_color_hex(client: AsyncClient):
    """Test that all agents have valid hex color codes."""
    import re

    response = await client.get("/api/v1/agents")
    data = response.json()
    agents = data.get("agents", [])

    hex_pattern = re.compile(r"^#[0-9A-Fa-f]{6}$")
    for agent in agents:
        assert hex_pattern.match(
            agent["color_hex"]
        ), f"Invalid hex color for {agent['slug']}: {agent['color_hex']}"
