"""Radarr API integration service."""

import logging
from dataclasses import dataclass

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class RadarrMovie:
    """Represents a movie from Radarr."""

    radarr_id: int
    title: str
    year: int
    rating: str
    poster_url: str | None
    quality: str
    size_bytes: int
    runtime: int  # minutes
    file_path: str
    video_codec: str
    container: str


class RadarrService:
    """Service for interacting with Radarr API."""

    def __init__(self) -> None:
        self.base_url = settings.RADARR_URL.rstrip("/")
        self.api_key = settings.RADARR_API_KEY

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def _headers(self) -> dict[str, str]:
        return {"X-Api-Key": self.api_key}

    async def get_movies(self) -> list[RadarrMovie]:
        """Fetch all movies from Radarr that have files."""
        if not self.configured:
            logger.warning("Radarr is not configured")
            return []

        movies = []
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/api/v3/movie",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch movies from Radarr: {e}")
                return []

        for item in data:
            if not item.get("hasFile") or not item.get("movieFile"):
                continue

            movie_file = item["movieFile"]
            media_info = movie_file.get("mediaInfo", {})

            # Get poster URL
            poster_url = None
            for image in item.get("images", []):
                if image.get("coverType") == "poster":
                    poster_url = image.get("remoteUrl") or image.get("url")
                    break

            # Parse quality
            quality_name = movie_file.get("quality", {}).get("quality", {}).get("name", "Unknown")

            # Parse runtime
            runtime_mins = item.get("runtime", 0)

            # Parse size
            size_bytes = movie_file.get("size", 0)

            # Parse video codec
            video_codec = media_info.get("videoCodec", "Unknown")

            # Container from file extension
            path = movie_file.get("path", "")
            container = path.rsplit(".", 1)[-1].upper() if "." in path else "Unknown"

            # Get certification/rating
            rating = item.get("certification", "")

            movies.append(
                RadarrMovie(
                    radarr_id=item["id"],
                    title=item["title"],
                    year=item.get("year", 0),
                    rating=rating,
                    poster_url=poster_url,
                    quality=quality_name,
                    size_bytes=size_bytes,
                    runtime=runtime_mins,
                    file_path=path,
                    video_codec=video_codec,
                    container=container,
                )
            )

        logger.info(f"Fetched {len(movies)} movies from Radarr")
        return movies
