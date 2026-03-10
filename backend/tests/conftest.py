"""
Pytest configuration and fixtures.
"""

from collections.abc import AsyncGenerator

import pytest_asyncio
from app.config import settings
from app.main import app
from httpx import ASGITransport, AsyncClient

# Override settings for testing
settings.TESTING = True


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
