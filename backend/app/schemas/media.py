"""Pydantic schemas for media API responses."""

from pydantic import BaseModel


class AudioTrackResponse(BaseModel):
    stream_index: int
    language: str | None
    language_code: str | None
    codec: str | None
    channels: str | None
    bitrate: str | None
    is_default: bool
    title: str | None


class SubtitleTrackResponse(BaseModel):
    stream_index: int
    language: str | None
    language_code: str | None
    format: str | None
    forced: bool
    is_default: bool
    title: str | None


class MediaResponse(BaseModel):
    id: str
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
    audio_tracks: list[AudioTrackResponse]
    subtitle_tracks: list[SubtitleTrackResponse]


class MediaListResponse(BaseModel):
    id: str
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


class StatsResponse(BaseModel):
    total_media: int
    total_movies: int
    total_shows: int
    total_audio_tracks: int
    total_subtitle_tracks: int
    total_size_gb: float
