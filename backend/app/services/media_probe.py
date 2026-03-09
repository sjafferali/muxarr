"""Media file probing service using ffprobe."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

if TYPE_CHECKING:
    from app.models.media import Media

logger = logging.getLogger(__name__)

# Codec display name mapping
CODEC_NAMES = {
    "truehd": "TrueHD",
    "eac3": "EAC3",
    "ac3": "AC3",
    "dts": "DTS",
    "aac": "AAC",
    "flac": "FLAC",
    "opus": "Opus",
    "vorbis": "Vorbis",
    "pcm_s16le": "PCM",
    "pcm_s24le": "PCM",
}

SUBTITLE_FORMAT_NAMES = {
    "hdmv_pgs_subtitle": "PGS",
    "subrip": "SRT",
    "ass": "ASS",
    "mov_text": "TX3G",
    "dvd_subtitle": "VobSub",
    "webvtt": "WebVTT",
}

# ISO 639-2 to language name mapping (common ones)
LANGUAGE_NAMES = {
    "eng": "English",
    "spa": "Spanish",
    "fra": "French",
    "deu": "German",
    "jpn": "Japanese",
    "por": "Portuguese",
    "ita": "Italian",
    "rus": "Russian",
    "kor": "Korean",
    "zho": "Chinese",
    "chi": "Chinese",
    "ara": "Arabic",
    "hin": "Hindi",
    "tha": "Thai",
    "vie": "Vietnamese",
    "pol": "Polish",
    "nld": "Dutch",
    "dut": "Dutch",
    "swe": "Swedish",
    "nor": "Norwegian",
    "dan": "Danish",
    "fin": "Finnish",
    "ces": "Czech",
    "cze": "Czech",
    "hun": "Hungarian",
    "rum": "Romanian",
    "ron": "Romanian",
    "tur": "Turkish",
    "heb": "Hebrew",
    "und": "Undetermined",
}


def _format_channels(channels: int, channel_layout: str | None) -> str:
    """Format channel count into display string."""
    if channel_layout:
        if "7.1" in channel_layout:
            return "7.1"
        if "5.1" in channel_layout:
            return "5.1"
        if "stereo" in channel_layout:
            return "2.0"
        if "mono" in channel_layout:
            return "1.0"
    if channels == 8:
        return "7.1"
    if channels == 6:
        return "5.1"
    if channels == 2:
        return "2.0"
    if channels == 1:
        return "1.0"
    return str(channels)


def _format_bitrate(bit_rate: str | None) -> str:
    """Format bitrate into display string."""
    if not bit_rate:
        return ""
    try:
        bps = int(bit_rate)
        kbps = bps // 1000
        return f"{kbps} kbps"
    except (ValueError, TypeError):
        return ""


def _get_codec_display(codec_name: str, profile: str | None = None) -> str:
    """Get display name for audio codec."""
    display = CODEC_NAMES.get(codec_name.lower(), codec_name.upper())
    if profile:
        profile_lower = profile.lower()
        if "atmos" in profile_lower:
            display += " Atmos"
        elif "dts-hd ma" in profile_lower or "dts-hd master" in profile_lower:
            display = "DTS-HD MA"
        elif "dts-hd" in profile_lower:
            display = "DTS-HD"
    return display


class MediaProbe:
    """Service for probing media files with ffprobe."""

    def __init__(self) -> None:
        self.ffprobe_path = settings.FFPROBE_PATH

    async def probe_file(
        self, file_path: str, timeout: float = 30.0
    ) -> dict[str, Any] | None:
        """Run ffprobe on a file and return parsed JSON output."""
        try:
            proc = await asyncio.create_subprocess_exec(
                self.ffprobe_path,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_streams",
                "-show_format",
                file_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                logger.error(f"ffprobe timed out after {timeout}s for {file_path}")
                return None

            if proc.returncode != 0:
                logger.error(f"ffprobe failed for {file_path}: {stderr.decode()}")
                return None

            result: dict[str, Any] = json.loads(stdout.decode())
            return result
        except FileNotFoundError:
            logger.error(f"ffprobe not found at {self.ffprobe_path}")
            return None
        except Exception as e:
            logger.error(f"Failed to probe {file_path}: {e}")
            return None

    def parse_audio_tracks(self, probe_data: dict[str, Any]) -> list[dict[str, object]]:
        """Parse audio tracks from ffprobe output."""
        tracks = []
        for stream in probe_data.get("streams", []):
            if stream.get("codec_type") != "audio":
                continue

            tags = stream.get("tags", {})
            lang_code = tags.get("language", "und")
            language = LANGUAGE_NAMES.get(lang_code, lang_code)
            codec_display = _get_codec_display(
                stream.get("codec_name", ""),
                stream.get("profile"),
            )
            channels = _format_channels(
                stream.get("channels", 0),
                stream.get("channel_layout"),
            )
            bitrate = _format_bitrate(
                stream.get("bit_rate") or tags.get("BPS") or tags.get("BPS-eng")
            )
            is_default = stream.get("disposition", {}).get("default", 0) == 1
            title = tags.get("title", f"{language} - {codec_display} {channels}")

            tracks.append(
                {
                    "stream_index": stream["index"],
                    "language": language,
                    "language_code": lang_code,
                    "codec": codec_display,
                    "channels": channels,
                    "bitrate": bitrate,
                    "is_default": is_default,
                    "title": title,
                }
            )

        return tracks

    def parse_subtitle_tracks(self, probe_data: dict[str, Any]) -> list[dict[str, object]]:
        """Parse subtitle tracks from ffprobe output."""
        tracks = []
        for stream in probe_data.get("streams", []):
            if stream.get("codec_type") != "subtitle":
                continue

            tags = stream.get("tags", {})
            lang_code = tags.get("language", "und")
            language = LANGUAGE_NAMES.get(lang_code, lang_code)
            fmt = SUBTITLE_FORMAT_NAMES.get(
                stream.get("codec_name", ""), stream.get("codec_name", "").upper()
            )
            is_default = stream.get("disposition", {}).get("default", 0) == 1
            forced = stream.get("disposition", {}).get("forced", 0) == 1
            title = tags.get("title", f"{language}")

            tracks.append(
                {
                    "stream_index": stream["index"],
                    "language": language,
                    "language_code": lang_code,
                    "format": fmt,
                    "forced": forced,
                    "is_default": is_default,
                    "title": title,
                }
            )

        return tracks

    async def rescan_media(self, db: AsyncSession, media: Media) -> None:
        """Re-scan a media file and update track info in the database."""
        from app.models.media import AudioTrack, SubtitleTrack

        if not media.file_path:
            return

        probe_data = await self.probe_file(media.file_path)
        if not probe_data:
            return

        # Delete existing tracks
        from sqlalchemy import delete

        await db.execute(delete(AudioTrack).where(AudioTrack.media_id == media.id))
        await db.execute(delete(SubtitleTrack).where(SubtitleTrack.media_id == media.id))

        # Add new tracks
        for track_data in self.parse_audio_tracks(probe_data):
            db.add(AudioTrack(media_id=media.id, **track_data))

        for track_data in self.parse_subtitle_tracks(probe_data):
            db.add(SubtitleTrack(media_id=media.id, **track_data))
