"""Media API endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.media import AudioTrack, Media, SubtitleTrack
from app.schemas.media import (
    MediaListResponse,
    MediaResponse,
    StatsResponse,
    SyncResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[MediaListResponse])
async def list_media(
    media_type: str | None = Query(None, description="Filter by type: movie or show"),
    search: str | None = Query(None, description="Search by title"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all media with optional filtering."""
    query = select(Media).options(
        selectinload(Media.audio_tracks), selectinload(Media.subtitle_tracks)
    )

    if media_type:
        query = query.where(Media.media_type == media_type)
    if search:
        query = query.where(Media.title.ilike(f"%{search}%"))

    query = query.order_by(Media.title)
    result = await db.execute(query)
    media_list = result.scalars().all()

    return [
        MediaListResponse(
            id=m.id,
            title=m.title,
            year=m.year,
            media_type=m.media_type,
            rating=m.rating,
            poster_url=m.poster_url,
            quality=m.quality,
            size=m.size,
            size_bytes=m.size_bytes or 0,
            runtime=m.runtime,
            video_codec=m.video_codec,
            container=m.container,
            audio_track_count=len(m.audio_tracks),
            subtitle_track_count=len(m.subtitle_tracks),
        )
        for m in media_list
    ]


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)) -> Any:
    """Get library statistics."""
    total = await db.scalar(select(func.count()).select_from(Media))
    movies = await db.scalar(
        select(func.count()).select_from(Media).where(Media.media_type == "movie")
    )
    shows = await db.scalar(
        select(func.count()).select_from(Media).where(Media.media_type == "show")
    )
    audio = await db.scalar(select(func.count()).select_from(AudioTrack))
    subs = await db.scalar(select(func.count()).select_from(SubtitleTrack))
    total_size = await db.scalar(select(func.sum(Media.size_bytes)).select_from(Media))

    return StatsResponse(
        total_media=total or 0,
        total_movies=movies or 0,
        total_shows=shows or 0,
        total_audio_tracks=audio or 0,
        total_subtitle_tracks=subs or 0,
        total_size_gb=round((total_size or 0) / (1024**3), 1),
    )


@router.get("/{media_id}", response_model=MediaResponse)
async def get_media(media_id: int, db: AsyncSession = Depends(get_db)) -> Any:
    """Get media details with all tracks."""
    result = await db.execute(
        select(Media)
        .where(Media.id == media_id)
        .options(selectinload(Media.audio_tracks), selectinload(Media.subtitle_tracks))
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.post("/{media_id}/tracks/audio/{track_id}/default")
async def set_default_audio(
    media_id: int, track_id: int, db: AsyncSession = Depends(get_db)
) -> Any:
    """Set an audio track as default."""
    from app.services.track_manager import TrackManager

    media = await db.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    if not media.file_path:
        raise HTTPException(status_code=400, detail="Media has no file path")

    track = await db.get(AudioTrack, track_id)
    if not track or track.media_id != media_id:
        raise HTTPException(status_code=404, detail="Audio track not found")

    manager = TrackManager()
    try:
        await manager.set_default_audio(media.file_path, track.stream_index)
    except Exception as e:
        logger.error(f"Failed to set default audio track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    result = await db.execute(select(AudioTrack).where(AudioTrack.media_id == media_id))
    for t in result.scalars().all():
        t.is_default = t.id == track_id

    await db.commit()
    return {"status": "ok", "message": "Default audio track updated"}


@router.post("/{media_id}/tracks/subtitle/{track_id}/default")
async def set_default_subtitle(
    media_id: int, track_id: int, db: AsyncSession = Depends(get_db)
) -> Any:
    """Set a subtitle track as default."""
    from app.services.track_manager import TrackManager

    media = await db.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    if not media.file_path:
        raise HTTPException(status_code=400, detail="Media has no file path")

    track = await db.get(SubtitleTrack, track_id)
    if not track or track.media_id != media_id:
        raise HTTPException(status_code=404, detail="Subtitle track not found")

    manager = TrackManager()
    try:
        await manager.set_default_subtitle(media.file_path, track.stream_index)
    except Exception as e:
        logger.error(f"Failed to set default subtitle track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    result = await db.execute(select(SubtitleTrack).where(SubtitleTrack.media_id == media_id))
    for t in result.scalars().all():
        t.is_default = t.id == track_id

    await db.commit()
    return {"status": "ok", "message": "Default subtitle track updated"}


@router.delete("/{media_id}/tracks/audio/{track_id}")
async def remove_audio_track(
    media_id: int, track_id: int, db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove an audio track from the media file."""
    from app.services.media_probe import MediaProbe
    from app.services.track_manager import TrackManager

    media_result = await db.execute(
        select(Media).where(Media.id == media_id).options(selectinload(Media.audio_tracks))
    )
    media = media_result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    if not media.file_path:
        raise HTTPException(status_code=400, detail="Media has no file path")

    track = await db.get(AudioTrack, track_id)
    if not track or track.media_id != media_id:
        raise HTTPException(status_code=404, detail="Audio track not found")

    if len(media.audio_tracks) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove the last audio track")

    manager = TrackManager()
    try:
        await manager.remove_track(media.file_path, track.stream_index)
    except Exception as e:
        logger.error(f"Failed to remove audio track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    # Re-scan to update stream indices after remux
    await db.execute(delete(AudioTrack).where(AudioTrack.media_id == media_id))
    await db.execute(delete(SubtitleTrack).where(SubtitleTrack.media_id == media_id))
    await db.flush()

    probe = MediaProbe()
    await probe.rescan_media(db, media)
    await db.commit()

    return {"status": "ok", "message": "Audio track removed"}


@router.delete("/{media_id}/tracks/subtitle/{track_id}")
async def remove_subtitle_track(
    media_id: int, track_id: int, db: AsyncSession = Depends(get_db)
) -> Any:
    """Remove a subtitle track from the media file."""
    from app.services.media_probe import MediaProbe
    from app.services.track_manager import TrackManager

    media = await db.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    if not media.file_path:
        raise HTTPException(status_code=400, detail="Media has no file path")

    track = await db.get(SubtitleTrack, track_id)
    if not track or track.media_id != media_id:
        raise HTTPException(status_code=404, detail="Subtitle track not found")

    manager = TrackManager()
    try:
        await manager.remove_track(media.file_path, track.stream_index)
    except Exception as e:
        logger.error(f"Failed to remove subtitle track: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to modify file: {e}") from None

    # Re-scan to update stream indices after remux
    await db.execute(delete(AudioTrack).where(AudioTrack.media_id == media_id))
    await db.execute(delete(SubtitleTrack).where(SubtitleTrack.media_id == media_id))
    await db.flush()

    probe = MediaProbe()
    await probe.rescan_media(db, media)
    await db.commit()

    return {"status": "ok", "message": "Subtitle track removed"}


@router.post("/sync", response_model=SyncResponse)
async def sync_media(db: AsyncSession = Depends(get_db)) -> Any:
    """Sync media from Radarr and Sonarr."""
    from app.services.sync_service import SyncService

    service = SyncService()
    result = await service.sync_all(db)
    return result
