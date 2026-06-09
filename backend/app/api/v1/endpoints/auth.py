"""Authentication endpoints."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.security import (
    auth_enabled,
    create_access_token,
    password_login_enabled,
    verify_credentials,
)

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthStatusResponse(BaseModel):
    auth_required: bool
    password_login: bool


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status() -> AuthStatusResponse:
    """Report whether authentication is required and how to satisfy it."""
    return AuthStatusResponse(
        auth_required=auth_enabled(),
        password_login=password_login_enabled(),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    """Exchange a username and password for a session token."""
    if not password_login_enabled():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password login is not enabled",
        )
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return TokenResponse(access_token=create_access_token(payload.username))
