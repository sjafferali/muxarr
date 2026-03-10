"""Media API endpoints."""

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.media import (
    AudioTrackResponse,
    EpisodeFileResponse,
    MediaListResponse,
    MediaResponse,
    StatsResponse,
    SubtitleTrackResponse,
)
from app.services.radarr import RadarrMovie, RadarrService
from app.services.sonarr import SonarrSeries, SonarrService

logger = logging.getLogger(__name__)
router = APIRouter()


def _format_size(size_bytes: int) -> str:
    """Format bytes into human-readable size."""
    if size_bytes >= 1024**3:
        return f"{size_bytes / (1024**3):.1f} GB"
    if size_bytes >= 1024**2:
        return f"{size_bytes / (1024**2):.1f} MB"
    return f"{size_bytes / 1024:.1f} KB"


def _format_runtime(minutes: int) -> str:
    """Format minutes into human-readable runtime."""
    if minutes <= 0:
        return ""
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"


def _movie_to_list_response(movie: RadarrMovie) -> MediaListResponse:
    return MediaListResponse(
        id=f"radarr_{movie.radarr_id}",
        title=movie.title,
        year=movie.year or None,
        media_type="movie",
        rating=movie.rating or None,
        poster_url=movie.poster_url,
        quality=movie.quality,
        size=_format_size(movie.size_bytes),
        size_bytes=movie.size_bytes,
        runtime=_format_runtime(movie.runtime),
        video_codec=movie.video_codec,
        container=movie.container,
        audio_track_count=movie.audio_stream_count,
        subtitle_track_count=movie.subtitle_count,
    )


def _series_to_list_response(series: SonarrSeries) -> MediaListResponse:
    return MediaListResponse(
        id=f"sonarr_{series.sonarr_id}",
        title=series.title,
        year=series.year or None,
        media_type="show",
        rating=series.rating or None,
        poster_url=series.poster_url,
        quality=series.quality,
        size=_format_size(series.size_bytes),
        size_bytes=series.size_bytes,
        runtime=f"{series.episode_count} Episodes",
        video_codec=series.video_codec,
        container=series.container,
        audio_track_count=series.audio_stream_count,
        subtitle_track_count=series.subtitle_count,
    )


async def _fetch_all_media(
    media_type: str | None = None,
) -> tuple[list[RadarrMovie], list[SonarrSeries]]:
    """Fetch media from Radarr and Sonarr concurrently."""
    radarr = RadarrService()
    sonarr = SonarrService()

    fetch_movies = media_type != "show"
    fetch_series = media_type != "movie"

    movies: list[RadarrMovie] = []
    series: list[SonarrSeries] = []

    coros: list[Any] = []
    labels: list[str] = []
    if fetch_movies and radarr.configured:
        coros.append(radarr.get_movies())
        labels.append("radarr")
    if fetch_series and sonarr.configured:
        coros.append(sonarr.get_series())
        labels.append("sonarr")

    results = await asyncio.gather(*coros, return_exceptions=True)

    for i, label in enumerate(labels):
        result = results[i]
        if isinstance(result, BaseException):
            logger.error(f"Failed to fetch from {label}: {result}")
            continue
        if label == "radarr":
            movies = list(result)
        else:
            series = list(result)

    return movies, series


async def _resolve_media(media_id: str) -> tuple[str, str]:
    """Parse composite ID and fetch file_path. Returns (file_path, title).

    Raises HTTPException if not found.
    """
    # Handle episode file IDs: sonarr_ef_{episodeFileId}
    if media_id.startswith("sonarr_ef_"):
        ef_id_str = media_id[len("sonarr_ef_") :]
        try:
            ef_id = int(ef_id_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid media ID format") from None
        sonarr = SonarrService()
        ef = await sonarr.get_episode_file(ef_id)
        if not ef:
            raise HTTPException(status_code=404, detail="Episode file not found")
        return ef.file_path, ef.episode_title

    parts = media_id.split("_", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid media ID format")

    arr_type, arr_id_str = parts
    try:
        arr_id = int(arr_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid media ID format") from None

    if arr_type == "radarr":
        radarr = RadarrService()
        movie = await radarr.get_movie(arr_id)
        if not movie:
            raise HTTPException(status_code=404, detail="Media not found")
        return movie.file_path, movie.title
    elif arr_type == "sonarr":
        sonarr = SonarrService()
        show = await sonarr.get_series_item(arr_id)
        if not show:
            raise HTTPException(status_code=404, detail="Media not found")
        return show.episode_file_path, show.title
    else:
        raise HTTPException(status_code=400, detail="Invalid media ID format")


@router.get("", response_model=list[MediaListResponse])
async def list_media(
    media_type: str | None = Query(None, description="Filter by type: movie or show"),
    search: str | None = Query(None, description="Search by title"),
) -> Any:
    """List all media with optional filtering."""
    movies, series = await _fetch_all_media(media_type)

    items: list[MediaListResponse] = []
    for m in movies:
        items.append(_movie_to_list_response(m))
    for s in series:
        items.append(_series_to_list_response(s))

    if search:
        search_lower = search.lower()
        items = [item for item in items if search_lower in item.title.lower()]

    items.sort(key=lambda x: x.title.lower())
    return items


@router.get("/stats", response_model=StatsResponse)
async def get_stats() -> Any:
    """Get library statistics."""
    movies, series = await _fetch_all_media()

    total_audio = sum(m.audio_stream_count for m in movies) + sum(
        s.audio_stream_count for s in series
    )
    total_subs = sum(m.subtitle_count for m in movies) + sum(s.subtitle_count for s in series)
    total_size = sum(m.size_bytes for m in movies) + sum(s.size_bytes for s in series)

    return StatsResponse(
        total_media=len(movies) + len(series),
        total_movies=len(movies),
        total_shows=len(series),
        total_audio_tracks=total_audio,
        total_subtitle_tracks=total_subs,
        total_size_gb=round(total_size / (1024**3), 1),
    )


@router.get("/{media_id}/episodes", response_model=list[EpisodeFileResponse])
async def list_episodes(media_id: str) -> Any:
    """List all episode files for a series."""
    if not media_id.startswith("sonarr_"):
        raise HTTPException(status_code=400, detail="Episodes only available for shows")

    try:
        series_id = int(media_id.split("_", 1)[1])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid media ID format") from None

    sonarr = SonarrService()
    episode_files = await sonarr.get_episode_files_for_series(series_id)

    return [
        EpisodeFileResponse(
            id=f"sonarr_ef_{ef.episode_file_id}",
            episode_file_id=ef.episode_file_id,
            season_number=ef.season_number,
            episode_numbers=ef.episode_numbers,
            episode_title=ef.episode_title,
            file_path=ef.file_path,
            size=_format_size(ef.size_bytes),
            size_bytes=ef.size_bytes,
            quality=ef.quality,
            video_codec=ef.video_codec,
            container=ef.container,
            audio_track_count=ef.audio_stream_count,
            subtitle_track_count=ef.subtitle_count,
        )
        for ef in episode_files
    ]


@router.get("/{media_id}", response_model=MediaResponse)
async def get_media(media_id: str) -> Any:
    """Get media details with all tracks."""
    from app.services.media_probe import MediaProbe

    file_path: str
    year: int | None
    rating: str | None
    poster_url: str | None
    size_bytes: int
    runtime_str: str
    quality: str
    video_codec: str
    container: str
    title: str
    media_type_str: str
    file_path_display: str | None

    # Handle episode file IDs: sonarr_ef_{episodeFileId}
    if media_id.startswith("sonarr_ef_"):
        ef_id_str = media_id[len("sonarr_ef_") :]
        try:
            ef_id = int(ef_id_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid media ID format") from None

        sonarr = SonarrService()
        ef = await sonarr.get_episode_file(ef_id)
        if not ef:
            raise HTTPException(status_code=404, detail="Episode file not found")

        # Fetch parent series for poster/year/rating
        series = await sonarr.get_series_item(ef.series_id)

        # Build episode label like "S01E02" or "S01E01-E02"
        if len(ef.episode_numbers) == 1:
            ep_label = f"S{ef.season_number:02d}E{ef.episode_numbers[0]:02d}"
        else:
            ep_label = (
                f"S{ef.season_number:02d}E{ef.episode_numbers[0]:02d}-E{ef.episode_numbers[-1]:02d}"
            )

        title = (
            f"{series.title} - {ep_label} - {ef.episode_title}"
            if series
            else f"{ep_label} - {ef.episode_title}"
        )
        year = series.year if series else None
        media_type_str = "episode"
        rating = series.rating if series else None
        poster_url = series.poster_url if series else None
        quality = ef.quality
        size_bytes = ef.size_bytes
        runtime_str = ep_label
        video_codec = ef.video_codec
        container = ef.container
        file_path = ef.file_path
        file_path_display = ef.file_path
    else:
        parts = media_id.split("_", 1)
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid media ID format")

        arr_type, arr_id_str = parts
        try:
            arr_id = int(arr_id_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid media ID format") from None

        if arr_type == "radarr":
            radarr = RadarrService()
            movie = await radarr.get_movie(arr_id)
            if not movie:
                raise HTTPException(status_code=404, detail="Media not found")
            title = movie.title
            year = movie.year or None
            media_type_str = "movie"
            rating = movie.rating or None
            poster_url = movie.poster_url
            quality = movie.quality
            size_bytes = movie.size_bytes
            runtime_str = _format_runtime(movie.runtime)
            video_codec = movie.video_codec
            container = movie.container
            file_path = movie.file_path
            file_path_display = movie.file_path
        elif arr_type == "sonarr":
            sonarr = SonarrService()
            show = await sonarr.get_series_item(arr_id)
            if not show:
                raise HTTPException(status_code=404, detail="Media not found")
            title = show.title
            year = show.year or None
            media_type_str = "show"
            rating = show.rating or None
            poster_url = show.poster_url
            quality = show.quality
            size_bytes = show.size_bytes
            runtime_str = f"{show.episode_count} Episodes"
            video_codec = show.video_codec
            container = show.container
            file_path = show.episode_file_path
            file_path_display = show.episode_file_path
        else:
            raise HTTPException(status_code=400, detail="Invalid media ID format")

    # Probe the file for track details
    probe = MediaProbe()
    probe_data = await probe.probe_file(file_path)

    audio_tracks: list[AudioTrackResponse] = []
    subtitle_tracks: list[SubtitleTrackResponse] = []
    if probe_data:
        audio_tracks = [AudioTrackResponse(**t) for t in probe.parse_audio_tracks(probe_data)]
        subtitle_tracks = [
            SubtitleTrackResponse(**t) for t in probe.parse_subtitle_tracks(probe_data)
        ]

    return MediaResponse(
        id=media_id,
        title=title,
        year=year,
        media_type=media_type_str,
        rating=rating,
        poster_url=poster_url,
        quality=quality,
        size=_format_size(size_bytes),
        size_bytes=size_bytes,
        runtime=runtime_str,
        video_codec=video_codec,
        container=container,
        file_path=file_path_display,
        audio_tracks=audio_tracks,
        subtitle_tracks=subtitle_tracks,
    )


@router.post("/{media_id}/tracks/audio/{stream_index}/default")
async def set_default_audio(media_id: str, stream_index: int) -> Any:
    """Set an audio track as default."""
    from app.services.track_manager import TrackManager

    file_path, _ = await _resolve_media(media_id)

    manager = TrackManager()
    try:
        await manager.set_default_audio(file_path, stream_index)
    except Exception as e:
        logger.error(f"Failed to set default audio track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    return {"status": "ok", "message": "Default audio track updated"}


@router.post("/{media_id}/tracks/subtitle/{stream_index}/default")
async def set_default_subtitle(media_id: str, stream_index: int) -> Any:
    """Set a subtitle track as default."""
    from app.services.track_manager import TrackManager

    file_path, _ = await _resolve_media(media_id)

    manager = TrackManager()
    try:
        await manager.set_default_subtitle(file_path, stream_index)
    except Exception as e:
        logger.error(f"Failed to set default subtitle track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    return {"status": "ok", "message": "Default subtitle track updated"}


@router.delete("/{media_id}/tracks/audio/{stream_index}")
async def remove_audio_track(media_id: str, stream_index: int) -> Any:
    """Remove an audio track from the media file."""
    from app.services.media_probe import MediaProbe
    from app.services.track_manager import TrackManager

    file_path, _ = await _resolve_media(media_id)

    # Verify there's more than one audio track
    probe = MediaProbe()
    probe_data = await probe.probe_file(file_path)
    if not probe_data:
        raise HTTPException(status_code=500, detail="Failed to probe media file")

    audio_tracks = probe.parse_audio_tracks(probe_data)
    if len(audio_tracks) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove the last audio track")

    if not any(t["stream_index"] == stream_index for t in audio_tracks):
        raise HTTPException(status_code=404, detail="Audio track not found")

    manager = TrackManager()
    try:
        await manager.remove_track(file_path, stream_index)
    except Exception as e:
        logger.error(f"Failed to remove audio track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    return {"status": "ok", "message": "Audio track removed"}


@router.delete("/{media_id}/tracks/subtitle/{stream_index}")
async def remove_subtitle_track(media_id: str, stream_index: int) -> Any:
    """Remove a subtitle track from the media file."""
    from app.services.media_probe import MediaProbe
    from app.services.track_manager import TrackManager

    file_path, _ = await _resolve_media(media_id)

    probe = MediaProbe()
    probe_data = await probe.probe_file(file_path)
    if not probe_data:
        raise HTTPException(status_code=500, detail="Failed to probe media file")

    subtitle_tracks = probe.parse_subtitle_tracks(probe_data)
    if not any(t["stream_index"] == stream_index for t in subtitle_tracks):
        raise HTTPException(status_code=404, detail="Subtitle track not found")

    manager = TrackManager()
    try:
        await manager.remove_track(file_path, stream_index)
    except Exception as e:
        logger.error(f"Failed to remove subtitle track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    return {"status": "ok", "message": "Subtitle track removed"}
