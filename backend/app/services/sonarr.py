"""Sonarr API integration service."""

import logging
from dataclasses import dataclass

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SonarrSeries:
    """Represents a series from Sonarr."""

    sonarr_id: int
    title: str
    year: int
    rating: str
    poster_url: str | None
    quality: str
    size_bytes: int
    episode_count: int
    episode_file_path: str  # path to first episode file (representative)
    video_codec: str
    container: str


class SonarrService:
    """Service for interacting with Sonarr API."""

    def __init__(self) -> None:
        self.base_url = settings.SONARR_URL.rstrip("/")
        self.api_key = settings.SONARR_API_KEY

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _headers(self) -> dict[str, str]:
        return {"X-Api-Key": self.api_key}

    async def get_series(self) -> list[SonarrSeries]:
        """Fetch all series from Sonarr that have episode files."""
        if not self.configured:
            logger.warning("Sonarr is not configured")
            return []

        series_list = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Get all series
                resp = await client.get(
                    f"{self.base_url}/api/v3/series",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                all_series = resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch series from Sonarr: {e}")
                return []

            for series in all_series:
                if not series.get("statistics", {}).get("episodeFileCount", 0):
                    continue

                series_id = series["id"]

                # Get episode files for this series
                try:
                    ef_resp = await client.get(
                        f"{self.base_url}/api/v3/episodefile",
                        params={"seriesId": series_id},
                        headers=self._headers(),
                    )
                    ef_resp.raise_for_status()
                    episode_files = ef_resp.json()
                except Exception as e:
                    logger.error(f"Failed to fetch episode files for series {series_id}: {e}")
                    continue

                if not episode_files:
                    continue

                # Use first episode file as representative
                first_file = episode_files[0]
                media_info = first_file.get("mediaInfo", {})

                # Poster URL
                poster_url = None
                for image in series.get("images", []):
                    if image.get("coverType") == "poster":
                        poster_url = image.get("remoteUrl") or image.get("url")
                        break

                # Quality from first file
                quality_name = (
                    first_file.get("quality", {}).get("quality", {}).get("name", "Unknown")
                )

                # Total size
                total_size = sum(ef.get("size", 0) for ef in episode_files)

                # Video codec
                video_codec = media_info.get("videoCodec", "Unknown")

                # Container
                path = first_file.get("path", "")
                container = path.rsplit(".", 1)[-1].upper() if "." in path else "Unknown"

                # Rating
                rating = series.get("certification", "")

                episode_count = len(episode_files)

                series_list.append(
                    SonarrSeries(
                        sonarr_id=series_id,
                        title=series["title"],
                        year=series.get("year", 0),
                        rating=rating,
                        poster_url=poster_url,
                        quality=quality_name,
                        size_bytes=total_size,
                        episode_count=episode_count,
                        episode_file_path=path,
                        video_codec=video_codec,
                        container=container,
                    )
                )

        logger.info(f"Fetched {len(series_list)} series from Sonarr")
        return series_list
