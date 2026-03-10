"""Radarr API integration service."""

import logging
from dataclasses import dataclass
from typing import Any

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
    audio_stream_count: int
    subtitle_count: int


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

    def _parse_movie(self, item: dict[str, Any]) -> RadarrMovie | None:
        """Parse a single movie item from Radarr API response."""
        if not item.get("hasFile") or not item.get("movieFile"):
            return None

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

        # Track counts from mediaInfo
        audio_stream_count = media_info.get("audioStreamCount", 0)
        subtitles_str = media_info.get("subtitles", "")
        subtitle_count = (
            len([s for s in subtitles_str.split("/") if s.strip()]) if subtitles_str else 0
        )

        return RadarrMovie(
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
            audio_stream_count=audio_stream_count,
            subtitle_count=subtitle_count,
        )

    async def get_movies(self) -> list[RadarrMovie]:
        """Fetch all movies from Radarr that have files."""
        if not self.configured:
            logger.warning("Radarr is not configured")
            return []

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

        movies = []
        for item in data:
            movie = self._parse_movie(item)
            if movie:
                movies.append(movie)

        logger.info(f"Fetched {len(movies)} movies from Radarr")
        return movies

    async def get_movie(self, movie_id: int) -> RadarrMovie | None:
        """Fetch a single movie from Radarr by ID."""
        if not self.configured:
            return None

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/api/v3/movie/{movie_id}",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                item = resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch movie {movie_id} from Radarr: {e}")
                return None

        return self._parse_movie(item)
