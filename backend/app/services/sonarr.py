"""Sonarr API integration service."""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any

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
    audio_stream_count: int
    subtitle_count: int


@dataclass
class SonarrEpisodeFile:
    """Represents an individual episode file from Sonarr."""

    episode_file_id: int
    series_id: int
    season_number: int
    episode_numbers: list[int]
    episode_title: str
    file_path: str
    size_bytes: int
    quality: str
    video_codec: str
    container: str
    audio_stream_count: int
    subtitle_count: int


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

    def _parse_series(
        self, series: dict[str, Any], episode_files: list[dict[str, Any]]
    ) -> SonarrSeries | None:
        """Parse a series and its episode files into a SonarrSeries."""
        if not episode_files:
            return None

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
        quality_name = first_file.get("quality", {}).get("quality", {}).get("name", "Unknown")

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

        # Track counts from mediaInfo
        audio_stream_count = media_info.get("audioStreamCount", 0)
        subtitles_str = media_info.get("subtitles", "")
        subtitle_count = (
            len([s for s in subtitles_str.split("/") if s.strip()]) if subtitles_str else 0
        )

        return SonarrSeries(
            sonarr_id=series["id"],
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
            audio_stream_count=audio_stream_count,
            subtitle_count=subtitle_count,
        )

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

                parsed = self._parse_series(series, episode_files)
                if parsed:
                    series_list.append(parsed)

        logger.info(f"Fetched {len(series_list)} series from Sonarr")
        return series_list

    async def get_series_item(self, series_id: int) -> SonarrSeries | None:
        """Fetch a single series from Sonarr by ID."""
        if not self.configured:
            return None

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.get(
                    f"{self.base_url}/api/v3/series/{series_id}",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                series = resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch series {series_id} from Sonarr: {e}")
                return None

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
                return None

        return self._parse_series(series, episode_files)

    def _parse_episode_file(
        self,
        ef: dict[str, Any],
        episode_map: dict[int, list[dict[str, Any]]],
    ) -> SonarrEpisodeFile | None:
        """Parse a single episode file dict into a SonarrEpisodeFile."""
        ef_id = ef.get("id")
        if ef_id is None:
            return None

        episodes = episode_map.get(ef_id, [])
        if not episodes:
            return None

        # Sort episodes by episode number and collect numbers
        episodes.sort(key=lambda e: e.get("episodeNumber", 0))
        episode_numbers = [e.get("episodeNumber", 0) for e in episodes]
        episode_title = episodes[0].get("title", "Unknown")

        media_info = ef.get("mediaInfo", {})
        path = ef.get("path", "")
        container = path.rsplit(".", 1)[-1].upper() if "." in path else "Unknown"
        quality_name = ef.get("quality", {}).get("quality", {}).get("name", "Unknown")

        audio_stream_count = media_info.get("audioStreamCount", 0)
        subtitles_str = media_info.get("subtitles", "")
        subtitle_count = (
            len([s for s in subtitles_str.split("/") if s.strip()]) if subtitles_str else 0
        )

        return SonarrEpisodeFile(
            episode_file_id=ef_id,
            series_id=ef.get("seriesId", 0),
            season_number=episodes[0].get("seasonNumber", 0),
            episode_numbers=episode_numbers,
            episode_title=episode_title,
            file_path=path,
            size_bytes=ef.get("size", 0),
            quality=quality_name,
            video_codec=media_info.get("videoCodec", "Unknown"),
            container=container,
            audio_stream_count=audio_stream_count,
            subtitle_count=subtitle_count,
        )

    async def get_episode_files_for_series(self, series_id: int) -> list[SonarrEpisodeFile]:
        """Fetch all episode files for a series with episode metadata."""
        if not self.configured:
            return []

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                ef_resp, ep_resp = await asyncio.gather(
                    client.get(
                        f"{self.base_url}/api/v3/episodefile",
                        params={"seriesId": series_id},
                        headers=self._headers(),
                    ),
                    client.get(
                        f"{self.base_url}/api/v3/episode",
                        params={"seriesId": series_id},
                        headers=self._headers(),
                    ),
                )
                ef_resp.raise_for_status()
                ep_resp.raise_for_status()
                episode_files = ef_resp.json()
                episodes = ep_resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch episode data for series {series_id}: {e}")
                return []

        # Build map: episodeFileId -> list of episode dicts
        episode_map: dict[int, list[dict[str, Any]]] = {}
        for ep in episodes:
            ef_id = ep.get("episodeFileId", 0)
            if ef_id > 0:
                episode_map.setdefault(ef_id, []).append(ep)

        result = []
        for ef in episode_files:
            parsed = self._parse_episode_file(ef, episode_map)
            if parsed:
                result.append(parsed)

        result.sort(
            key=lambda x: (x.season_number, x.episode_numbers[0] if x.episode_numbers else 0)
        )
        return result

    async def get_episode_file(self, episode_file_id: int) -> SonarrEpisodeFile | None:
        """Fetch a single episode file by its ID."""
        if not self.configured:
            return None

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                ef_resp, ep_resp = await asyncio.gather(
                    client.get(
                        f"{self.base_url}/api/v3/episodefile/{episode_file_id}",
                        headers=self._headers(),
                    ),
                    client.get(
                        f"{self.base_url}/api/v3/episode",
                        params={"episodeFileId": episode_file_id},
                        headers=self._headers(),
                    ),
                )
                ef_resp.raise_for_status()
                ep_resp.raise_for_status()
                ef = ef_resp.json()
                episodes = ep_resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch episode file {episode_file_id}: {e}")
                return None

        episode_map: dict[int, list[dict[str, Any]]] = {episode_file_id: episodes}
        return self._parse_episode_file(ef, episode_map)
