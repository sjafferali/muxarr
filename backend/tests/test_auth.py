"""Tests for authentication."""

import base64

import pytest
from app.config import settings
from app.core.security import create_access_token
from httpx import AsyncClient


@pytest.fixture
def enable_password_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "AUTH_USERNAME", "admin")
    monkeypatch.setattr(settings, "AUTH_PASSWORD", "secret")
    monkeypatch.setattr(settings, "API_TOKEN", "")


@pytest.fixture
def enable_token_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "AUTH_USERNAME", "")
    monkeypatch.setattr(settings, "AUTH_PASSWORD", "")
    monkeypatch.setattr(settings, "API_TOKEN", "secret-token")


async def test_status_reports_disabled_by_default(client: AsyncClient):
    response = await client.get("/api/v1/auth/status")
    assert response.status_code == 200
    assert response.json() == {"auth_required": False, "password_login": False}


async def test_media_open_when_auth_disabled(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "AUTH_USERNAME", "")
    monkeypatch.setattr(settings, "AUTH_PASSWORD", "")
    monkeypatch.setattr(settings, "API_TOKEN", "")
    # The endpoint runs (auth does not block it); upstream config is what fails, not auth.
    response = await client.get("/api/v1/media")
    assert response.status_code != 401


async def test_status_reports_enabled(client: AsyncClient, enable_password_auth: None):
    response = await client.get("/api/v1/auth/status")
    assert response.json() == {"auth_required": True, "password_login": True}


async def test_media_requires_auth_when_enabled(client: AsyncClient, enable_password_auth: None):
    response = await client.get("/api/v1/media")
    assert response.status_code == 401


async def test_login_rejects_bad_credentials(client: AsyncClient, enable_password_auth: None):
    response = await client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "wrong"}
    )
    assert response.status_code == 401


async def test_login_issues_token_and_grants_access(
    client: AsyncClient, enable_password_auth: None
):
    response = await client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "secret"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token

    authed = await client.get("/api/v1/media", headers={"Authorization": f"Bearer {token}"})
    assert authed.status_code != 401


async def test_basic_auth_grants_access(client: AsyncClient, enable_password_auth: None):
    credentials = base64.b64encode(b"admin:secret").decode("utf-8")
    response = await client.get(
        "/api/v1/media", headers={"Authorization": f"Basic {credentials}"}
    )
    assert response.status_code != 401


async def test_login_disabled_without_password(client: AsyncClient, enable_token_auth: None):
    response = await client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "secret"}
    )
    assert response.status_code == 400


async def test_api_token_via_bearer(client: AsyncClient, enable_token_auth: None):
    missing = await client.get("/api/v1/media")
    assert missing.status_code == 401

    response = await client.get(
        "/api/v1/media", headers={"Authorization": "Bearer secret-token"}
    )
    assert response.status_code != 401


async def test_api_token_via_header(client: AsyncClient, enable_token_auth: None):
    wrong = await client.get("/api/v1/media", headers={"X-API-Key": "nope"})
    assert wrong.status_code == 401

    response = await client.get("/api/v1/media", headers={"X-API-Key": "secret-token"})
    assert response.status_code != 401


async def test_session_token_helper_roundtrips(enable_password_auth: None):
    token = create_access_token("admin")
    assert isinstance(token, str) and token
