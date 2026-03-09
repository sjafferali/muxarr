"""Sync service to import media from Radarr/Sonarr and probe files."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import AudioTrack, Media, SubtitleTrack
from app.services.media_probe import MediaProbe
from app.services.radarr import RadarrService
from app.services.sonarr import SonarrService

logger = logging.getLogger(__name__)


def _format_size(size_bytes: int) -> str:
    """Format bytes to human readable string."""
    gb = size_bytes / (1024**3)
    if gb >= 1:
        return f"{gb:.1f} GB"
    mb = size_bytes / (1024**2)
    return f"{mb:.0f} MB"


class SyncService:
    """Service to sync media library from Radarr and Sonarr."""

    def __init__(self) -> None:
        self.radarr = RadarrService()
        self.sonarr = SonarrService()
        self.probe = MediaProbe()

    async def sync_all(self, db: AsyncSession) -> dict[str, int | list[str]]:
        """Sync all media from configured sources."""
        synced = 0
        errors: list[str] = []

        # Sync from Radarr
        if self.radarr.configured:
            count, errs = await self._sync_radarr(db)
            synced += count
            errors.extend(errs)

        # Sync from Sonarr
        if self.sonarr.configured:
            count, errs = await self._sync_sonarr(db)
            synced += count
            errors.extend(errs)

        if not self.radarr.configured and not self.sonarr.configured:
            errors.append("Neither Radarr nor Sonarr is configured")

        return {"synced": synced, "errors": errors}

    async def _sync_radarr(self, db: AsyncSession) -> tuple[int, list[str]]:
        """Sync movies from Radarr."""
        synced = 0
        errors: list[str] = []

        try:
            movies = await self.radarr.get_movies()
        except Exception as e:
            return 0, [f"Radarr sync failed: {e}"]

        for movie in movies:
            try:
                # Check if already exists
                result = await db.execute(
                    select(Media).where(
                        Media.arr_type == "radarr",
                        Media.arr_id == movie.radarr_id,
                    )
                )
                existing = result.scalar_one_or_none()

                hours = movie.runtime // 60
                mins = movie.runtime % 60
                runtime_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

                if existing:
                    # Update existing
                    existing.title = movie.title
                    existing.year = movie.year
                    existing.rating = movie.rating
                    existing.poster_url = movie.poster_url
                    existing.quality = movie.quality
                    existing.size = _format_size(movie.size_bytes)
                    existing.size_bytes = float(movie.size_bytes)
                    existing.runtime = runtime_str
                    existing.video_codec = movie.video_codec
                    existing.container = movie.container
                    existing.file_path = movie.file_path
                    media = existing
                else:
                    # Create new
                    media = Media(
                        title=movie.title,
                        year=movie.year,
                        media_type="movie",
                        rating=movie.rating,
                        poster_url=movie.poster_url,
                        quality=movie.quality,
                        size=_format_size(movie.size_bytes),
                        size_bytes=float(movie.size_bytes),
                        runtime=runtime_str,
                        video_codec=movie.video_codec,
                        container=movie.container,
                        file_path=movie.file_path,
                        arr_id=movie.radarr_id,
                        arr_type="radarr",
                    )
                    db.add(media)
                    await db.flush()

                # Probe file for tracks
                await self._probe_and_update_tracks(db, media)
                synced += 1

            except Exception as e:
                errors.append(f"Failed to sync movie '{movie.title}': {e}")
                logger.error(f"Failed to sync movie '{movie.title}': {e}")

        await db.commit()
        return synced, errors

    async def _sync_sonarr(self, db: AsyncSession) -> tuple[int, list[str]]:
        """Sync series from Sonarr."""
        synced = 0
        errors: list[str] = []

        try:
            series_list = await self.sonarr.get_series()
        except Exception as e:
            return 0, [f"Sonarr sync failed: {e}"]

        for series in series_list:
            try:
                result = await db.execute(
                    select(Media).where(
                        Media.arr_type == "sonarr",
                        Media.arr_id == series.sonarr_id,
                    )
                )
                existing = result.scalar_one_or_none()

                runtime_str = (
                    f"{series.episode_count} Episode{'s' if series.episode_count != 1 else ''}"
                )

                if existing:
                    existing.title = series.title
                    existing.year = series.year
                    existing.rating = series.rating
                    existing.poster_url = series.poster_url
                    existing.quality = series.quality
                    existing.size = _format_size(series.size_bytes)
                    existing.size_bytes = float(series.size_bytes)
                    existing.runtime = runtime_str
                    existing.video_codec = series.video_codec
                    existing.container = series.container
                    existing.file_path = series.episode_file_path
                    media = existing
                else:
                    media = Media(
                        title=series.title,
                        year=series.year,
                        media_type="show",
                        rating=series.rating,
                        poster_url=series.poster_url,
                        quality=series.quality,
                        size=_format_size(series.size_bytes),
                        size_bytes=float(series.size_bytes),
                        runtime=runtime_str,
                        video_codec=series.video_codec,
                        container=series.container,
                        file_path=series.episode_file_path,
                        arr_id=series.sonarr_id,
                        arr_type="sonarr",
                    )
                    db.add(media)
                    await db.flush()

                await self._probe_and_update_tracks(db, media)
                synced += 1

            except Exception as e:
                errors.append(f"Failed to sync series '{series.title}': {e}")
                logger.error(f"Failed to sync series '{series.title}': {e}")

        await db.commit()
        return synced, errors

    async def _probe_and_update_tracks(self, db: AsyncSession, media: Media) -> None:
        """Probe a media file and update its tracks in the database."""
        if not media.file_path:
            return

        probe_data = await self.probe.probe_file(media.file_path)
        if not probe_data:
            logger.warning(f"Could not probe file: {media.file_path}")
            return

        # Delete existing tracks
        from sqlalchemy import delete

        await db.execute(delete(AudioTrack).where(AudioTrack.media_id == media.id))
        await db.execute(delete(SubtitleTrack).where(SubtitleTrack.media_id == media.id))

        # Add audio tracks
        for track_data in self.probe.parse_audio_tracks(probe_data):
            db.add(AudioTrack(media_id=media.id, **track_data))

        # Add subtitle tracks
        for track_data in self.probe.parse_subtitle_tracks(probe_data):
            db.add(SubtitleTrack(media_id=media.id, **track_data))
