"""
Health check endpoints.
"""

import httpx
from fastapi import APIRouter

from app.config import settings
from app.services.radarr import RadarrService
from app.services.sonarr import SonarrService

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """
    Basic health check endpoint.
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
    }


@router.get("/health/ready")
async def readiness_check() -> dict[str, object]:
    """
    Readiness check endpoint.
    Verifies Radarr/Sonarr connectivity.
    """
    radarr_ok = False
    sonarr_ok = False

    radarr = RadarrService()
    sonarr = SonarrService()

    if radarr.configured:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{radarr.base_url}/api/v3/system/status",
                    headers=radarr._headers(),
                )
                radarr_ok = resp.status_code == 200
        except Exception:
            pass

    if sonarr.configured:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{sonarr.base_url}/api/v3/system/status",
                    headers=sonarr._headers(),
                )
                sonarr_ok = resp.status_code == 200
        except Exception:
            pass

    ready = (not radarr.configured or radarr_ok) and (not sonarr.configured or sonarr_ok)

    return {
        "status": "ready" if ready else "not_ready",
        "radarr": "connected"
        if radarr_ok
        else ("not_configured" if not radarr.configured else "disconnected"),
        "sonarr": "connected"
        if sonarr_ok
        else ("not_configured" if not sonarr.configured else "disconnected"),
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
    }
