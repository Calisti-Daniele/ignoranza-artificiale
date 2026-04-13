"""
Shared pytest fixtures and configuration for all backend tests.
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import AsyncGenerator
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Ensure backend app directory is on path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Resolve the test database URL from the environment, falling back to a
# sensible local default.  CI injects TEST_DATABASE_URL explicitly.
_TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/test_ignoranza_artificiale",
)

# Set test environment variables BEFORE any app imports
os.environ["DATABASE_URL"] = _TEST_DATABASE_URL
os.environ["REDIS_URL"] = os.environ.get("REDIS_URL", "redis://localhost:6379")
os.environ["OPENROUTER_API_KEY"] = os.environ.get(
    "OPENROUTER_API_KEY", "test-api-key-for-testing-only"
)
os.environ["CORS_ORIGINS"] = os.environ.get(
    "CORS_ORIGINS", '["http://localhost:3000"]'
)
os.environ["HTTPS_ENABLED"] = os.environ.get("HTTPS_ENABLED", "false")
os.environ["DOCS_ENABLED"] = os.environ.get("DOCS_ENABLED", "false")
os.environ["ALLOWED_HOSTS"] = os.environ.get(
    "ALLOWED_HOSTS", '["localhost", "127.0.0.1", "testserver"]'
)

# Test engine uses NullPool so asyncpg never reuses connections across
# coroutines or event loops — this prevents the "Task got Future" RuntimeError.
_test_engine = create_async_engine(_TEST_DATABASE_URL, poolclass=NullPool)
_TestSessionFactory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=_test_engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


def _run_alembic_migrations() -> None:
    """Run 'alembic upgrade head' against the test database via subprocess.

    Alembic reads DATABASE_URL from the environment (already set above) so no
    extra configuration is required.  The working directory is set to the
    backend root so that alembic.ini is found automatically.
    """
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        cwd=str(backend_path),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Alembic migrations failed:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
        )


# Run migrations once at collection time so that the schema exists before any
# test session begins.
_run_alembic_migrations()


# Configure event loop
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# Mock Redis for testing
class MockRedis:
    """Simple in-memory Redis mock for testing."""

    def __init__(self):
        self._store = {}
        self._expiry = {}

    async def get(self, key: str) -> str | None:
        """Get value from mock store."""
        if key in self._expiry:
            import time
            if time.time() > self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)
                return None
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        """Set value in mock store."""
        self._store[key] = value
        if ex:
            import time
            self._expiry[key] = time.time() + ex

    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        if key in self._expiry:
            import time
            if time.time() > self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)
                return False
        return key in self._store

    async def incr(self, key: str) -> int:
        """Increment key value."""
        val = int(self._store.get(key, "0")) + 1
        self._store[key] = str(val)
        return val

    async def script_load(self, script: str) -> str:
        """Mock script load."""
        return "mock_sha_1234567890ab"

    async def evalsha(self, sha: str, numkeys: int, *args) -> int:
        """Mock evalsha for rate limiter."""
        if len(args) < 2:
            return 0
        key = args[0]
        try:
            window = int(args[1])
        except (ValueError, IndexError):
            return 0
        count = int(self._store.get(key, "0")) + 1
        self._store[key] = str(count)
        return count

    async def aclose(self) -> None:
        """Close connection (no-op for mock)."""
        pass


@pytest_asyncio.fixture
async def mock_redis():
    """Provide a mock Redis instance."""
    return MockRedis()


@pytest_asyncio.fixture
async def client(mock_redis):
    """Create an async client with mocked dependencies."""
    from httpx import AsyncClient
    from httpx._transports.asgi import ASGITransport

    # Import app AFTER env vars are set
    from app.main import app
    from app.core.dependencies import get_db, get_redis

    async def override_get_db():
        async with _TestSessionFactory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_redis():
        yield mock_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sync_client():
    """Create a synchronous test client."""
    from fastapi.testclient import TestClient
    from app.main import app

    return TestClient(app)
