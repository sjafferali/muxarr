"""Track management service using mkvpropedit and mkvmerge."""

import asyncio
import logging
import os
import shutil
import tempfile

from app.config import settings

logger = logging.getLogger(__name__)


class TrackManager:
    """Service for modifying tracks in MKV files."""

    def __init__(self) -> None:
        self.mkvpropedit_path = settings.MKVPROPEDIT_PATH
        self.mkvmerge_path = settings.MKVMERGE_PATH

    async def _run_command(self, *args: str) -> tuple[int, str, str]:
        """Run a command and return (returncode, stdout, stderr)."""
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return proc.returncode or 0, stdout.decode(), stderr.decode()

    async def set_default_audio(self, file_path: str, stream_index: int) -> None:
        """Set an audio track as default, clearing default from all other audio tracks.

        Uses mkvpropedit to modify track flags in-place without remuxing.
        mkvpropedit uses 1-based track numbers (all tracks), not stream indices.
        We need to identify the track number from the stream index.
        """
        # First, get track info from mkvmerge to map stream indices to track numbers
        track_map = await self._get_track_map(file_path)

        # Set all audio tracks to non-default, then set the target as default
        for track_num, info in track_map.items():
            if info["type"] == "audio":
                is_target = info["stream_index"] == stream_index
                flag = "1" if is_target else "0"
                rc, stdout, stderr = await self._run_command(
                    self.mkvpropedit_path,
                    file_path,
                    "--edit",
                    f"track:{track_num}",
                    "--set",
                    f"flag-default={flag}",
                )
                if rc != 0:
                    raise RuntimeError(f"mkvpropedit failed: {stderr}")

        logger.info(f"Set default audio track (stream {stream_index}) in {file_path}")

    async def set_default_subtitle(self, file_path: str, stream_index: int) -> None:
        """Set a subtitle track as default, clearing default from all other subtitle tracks."""
        track_map = await self._get_track_map(file_path)

        for track_num, info in track_map.items():
            if info["type"] == "subtitles":
                is_target = info["stream_index"] == stream_index
                flag = "1" if is_target else "0"
                rc, stdout, stderr = await self._run_command(
                    self.mkvpropedit_path,
                    file_path,
                    "--edit",
                    f"track:{track_num}",
                    "--set",
                    f"flag-default={flag}",
                )
                if rc != 0:
                    raise RuntimeError(f"mkvpropedit failed: {stderr}")

        logger.info(f"Set default subtitle track (stream {stream_index}) in {file_path}")

    async def remove_track(self, file_path: str, stream_index: int) -> None:
        """Remove a track from the file by remuxing with mkvmerge.

        This creates a new file without the specified track, then replaces the original.
        """
        track_map = await self._get_track_map(file_path)

        # Find the track ID for mkvmerge (0-based within its type)
        target_track = None
        for _track_num, info in track_map.items():
            if info["stream_index"] == stream_index:
                target_track = info
                break

        if not target_track:
            raise RuntimeError(f"Track with stream index {stream_index} not found")

        # mkvmerge uses type-specific track IDs (0-based)
        track_type = target_track["type"]
        type_id = target_track["type_index"]

        # Build mkvmerge command to exclude the track
        fd, temp_path = tempfile.mkstemp(suffix=".mkv", dir=os.path.dirname(file_path))
        os.close(fd)

        try:
            if track_type == "audio":
                flag = "--audio-tracks"
            elif track_type == "subtitles":
                flag = "--subtitle-tracks"
            else:
                raise RuntimeError(f"Unsupported track type: {track_type}")

            rc, stdout, stderr = await self._run_command(
                self.mkvmerge_path,
                "-o",
                temp_path,
                flag,
                f"!{type_id}",
                file_path,
            )

            if rc not in (0, 1):  # mkvmerge returns 1 for warnings
                os.unlink(temp_path)
                raise RuntimeError(f"mkvmerge failed: {stderr}")

            # Replace original with new file
            shutil.move(temp_path, file_path)
            logger.info(f"Removed track (stream {stream_index}) from {file_path}")

        except Exception:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise

    async def _get_track_map(self, file_path: str) -> dict[int, dict[str, object]]:
        """Get mapping of track numbers to stream info using mkvmerge --identify.

        Returns dict of {track_number: {type, stream_index, type_index}}.
        Track numbers are 1-based (for mkvpropedit).
        """
        rc, stdout, stderr = await self._run_command(
            self.mkvmerge_path,
            "--identify",
            "--identification-format",
            "json",
            file_path,
        )

        if rc != 0:
            raise RuntimeError(f"mkvmerge identify failed: {stderr}")

        import json

        data = json.loads(stdout)

        track_map = {}
        type_counters: dict[str, int] = {}

        for track in data.get("tracks", []):
            track_type = track.get("type", "")
            track_id = track.get("id", 0)  # 0-based mkvmerge track ID
            properties = track.get("properties", {})

            type_index = type_counters.get(track_type, 0)
            type_counters[track_type] = type_index + 1

            # mkvpropedit track numbers are 1-based, covering all track types sequentially
            track_number = track_id + 1  # video track is usually 0

            # The stream_index in ffprobe maps to the track ID in mkvmerge
            # (both are 0-based indices of all tracks in the container)
            track_map[track_number] = {
                "type": track_type,
                "stream_index": track_id,
                "type_index": type_index,
                "codec": properties.get("codec_id", ""),
                "language": properties.get("language", "und"),
            }

        return track_map
