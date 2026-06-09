"""Authentication helpers and request dependencies.

Authentication is optional. It is enforced only when credentials are
configured: a username/password pair (for browser and HTTP Basic login)
and/or a static API token (for programmatic access).
"""

import base64
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from app.config import settings

ALGORITHM = "HS256"


def password_login_enabled() -> bool:
    """Username/password login is available when both are configured."""
    return bool(settings.AUTH_USERNAME and settings.AUTH_PASSWORD)


def auth_enabled() -> bool:
    """Authentication is required when any credential is configured."""
    return password_login_enabled() or bool(settings.API_TOKEN)


def _constant_time_equals(provided: str, expected: str) -> bool:
    return secrets.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))


def verify_credentials(username: str, password: str) -> bool:
    """Check a username/password pair against the configured credentials."""
    return (
        password_login_enabled()
        and _constant_time_equals(username, settings.AUTH_USERNAME)
        and _constant_time_equals(password, settings.AUTH_PASSWORD)
    )


def create_access_token(subject: str) -> str:
    """Issue a signed session token for a successful login."""
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "exp": expire}
    token: str = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token


def _is_valid_session_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return False
    return bool(payload.get("sub"))


def _matches_api_token(token: str) -> bool:
    return bool(settings.API_TOKEN) and _constant_time_equals(token, settings.API_TOKEN)


def require_auth(request: Request) -> None:
    """Allow the request only when authentication is satisfied.

    Accepts a session token issued by login or the static API token via the
    ``Authorization: Bearer`` header, the static API token via ``X-API-Key``,
    or a username/password pair via HTTP Basic. Requests pass through
    untouched when no credentials are configured.
    """
    if not auth_enabled():
        return

    authorization = request.headers.get("Authorization", "")

    if authorization.startswith("Bearer "):
        token = authorization[len("Bearer ") :].strip()
        if _matches_api_token(token) or _is_valid_session_token(token):
            return

    api_key = request.headers.get("X-API-Key")
    if api_key and _matches_api_token(api_key):
        return

    if authorization.startswith("Basic "):
        try:
            decoded = base64.b64decode(authorization[len("Basic ") :]).decode("utf-8")
            username, _, password = decoded.partition(":")
        except (ValueError, UnicodeDecodeError):
            username, password = "", ""
        if verify_credentials(username, password):
            return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
