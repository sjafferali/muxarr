"""
API v1 main router.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import media

# Create main API router
api_router = APIRouter()

api_router.include_router(media.router, prefix="/media", tags=["media"])


@api_router.get("/")
async def root() -> dict[str, str]:
    """API v1 root endpoint."""
    return {"message": "Welcome to Muxarr API v1"}
