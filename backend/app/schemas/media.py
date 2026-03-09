"""Pydantic schemas for media API responses."""

from datetime import datetime

from pydantic import BaseModel


class AudioTrackResponse(BaseModel):
    id: int
    stream_index: int
    language: str | None
    language_code: str | None
    codec: str | None
    channels: str | None
    bitrate: str | None
    is_default: bool
    title: str | None

    model_config = {"from_attributes": True}


class SubtitleTrackResponse(BaseModel):
    id: int
    stream_index: int
    language: str | None
    language_code: str | None
    format: str | None
    forced: bool
    is_default: bool
    title: str | None

    model_config = {"from_attributes": True}


class MediaResponse(BaseModel):
    id: int
    title: str
    year: int | None
    media_type: str
    rating: str | None
    poster_url: str | None
    quality: str | None
    size: str | None
    size_bytes: float
    runtime: str | None
    video_codec: str | None
    container: str | None
    file_path: str | None
    arr_id: int | None
    arr_type: str | None
    last_scanned: datetime | None
    audio_tracks: list[AudioTrackResponse]
    subtitle_tracks: list[SubtitleTrackResponse]

    model_config = {"from_attributes": True}


class MediaListResponse(BaseModel):
    id: int
    title: str
    year: int | None
    media_type: str
    rating: str | None
    poster_url: str | None
    quality: str | None
    size: str | None
    size_bytes: float
    runtime: str | None
    video_codec: str | None
    container: str | None
    audio_track_count: int
    subtitle_track_count: int

    model_config = {"from_attributes": True}


class SyncResponse(BaseModel):
    synced: int
    errors: list[str]


class StatsResponse(BaseModel):
    total_media: int
    total_movies: int
    total_shows: int
    total_audio_tracks: int
    total_subtitle_tracks: int
    total_size_gb: float
