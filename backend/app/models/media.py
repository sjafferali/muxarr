"""Media models for storing track information."""

from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String, index=True)
    year: Mapped[int | None] = mapped_column(default=None)
    media_type: Mapped[str] = mapped_column(String)
    rating: Mapped[str | None] = mapped_column(String, default=None)
    poster_url: Mapped[str | None] = mapped_column(String, default=None)
    quality: Mapped[str | None] = mapped_column(String, default=None)
    size: Mapped[str | None] = mapped_column(String, default=None)
    size_bytes: Mapped[float] = mapped_column(default=0.0)
    runtime: Mapped[str | None] = mapped_column(String, default=None)
    video_codec: Mapped[str | None] = mapped_column(String, default=None)
    container: Mapped[str | None] = mapped_column(String, default=None)
    file_path: Mapped[str | None] = mapped_column(String, default=None)
    arr_id: Mapped[int | None] = mapped_column(default=None)
    arr_type: Mapped[str | None] = mapped_column(String, default=None)
    last_scanned: Mapped[datetime | None] = mapped_column(server_default=func.now())
    created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    audio_tracks: Mapped[list["AudioTrack"]] = relationship(
        back_populates="media", cascade="all, delete-orphan"
    )
    subtitle_tracks: Mapped[list["SubtitleTrack"]] = relationship(
        back_populates="media", cascade="all, delete-orphan"
    )


class AudioTrack(Base):
    __tablename__ = "audio_tracks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    media_id: Mapped[int] = mapped_column(ForeignKey("media.id", ondelete="CASCADE"))
    stream_index: Mapped[int]
    language: Mapped[str | None] = mapped_column(String, default=None)
    language_code: Mapped[str | None] = mapped_column(String, default=None)
    codec: Mapped[str | None] = mapped_column(String, default=None)
    channels: Mapped[str | None] = mapped_column(String, default=None)
    bitrate: Mapped[str | None] = mapped_column(String, default=None)
    is_default: Mapped[bool] = mapped_column(default=False)
    title: Mapped[str | None] = mapped_column(String, default=None)

    media: Mapped["Media"] = relationship(back_populates="audio_tracks")


class SubtitleTrack(Base):
    __tablename__ = "subtitle_tracks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    media_id: Mapped[int] = mapped_column(ForeignKey("media.id", ondelete="CASCADE"))
    stream_index: Mapped[int]
    language: Mapped[str | None] = mapped_column(String, default=None)
    language_code: Mapped[str | None] = mapped_column(String, default=None)
    format: Mapped[str | None] = mapped_column(String, default=None)
    forced: Mapped[bool] = mapped_column(default=False)
    is_default: Mapped[bool] = mapped_column(default=False)
    title: Mapped[str | None] = mapped_column(String, default=None)

    media: Mapped["Media"] = relationship(back_populates="subtitle_tracks")
