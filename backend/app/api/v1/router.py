"""
API v1 main router.
"""

from fastapi import APIRouter, Depends

from app.api.v1.endpoints import auth, media
from app.core.security import require_auth

# Create main API router
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(
    media.router,
    prefix="/media",
    tags=["media"],
    dependencies=[Depends(require_auth)],
)


@api_router.get("/")
async def root() -> dict[str, str]:
    """API v1 root endpoint."""
    return {"message": "Welcome to Muxarr API v1"}
