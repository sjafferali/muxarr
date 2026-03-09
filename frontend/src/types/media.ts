export interface AudioTrack {
  id: number
  stream_index: number
  language: string | null
  language_code: string | null
  codec: string | null
  channels: string | null
  bitrate: string | null
  is_default: boolean
  title: string | null
}

export interface SubtitleTrack {
  id: number
  stream_index: number
  language: string | null
  language_code: string | null
  format: string | null
  forced: boolean
  is_default: boolean
  title: string | null
}

export interface MediaItem {
  id: number
  title: string
  year: number | null
  media_type: 'movie' | 'show'
  rating: string | null
  poster_url: string | null
  quality: string | null
  size: string | null
  size_bytes: number
  runtime: string | null
  video_codec: string | null
  container: string | null
  audio_track_count: number
  subtitle_track_count: number
}

export interface MediaDetail {
  id: number
  title: string
  year: number | null
  media_type: 'movie' | 'show'
  rating: string | null
  poster_url: string | null
  quality: string | null
  size: string | null
  size_bytes: number
  runtime: string | null
  video_codec: string | null
  container: string | null
  file_path: string | null
  arr_id: number | null
  arr_type: string | null
  last_scanned: string | null
  audio_tracks: AudioTrack[]
  subtitle_tracks: SubtitleTrack[]
}

export interface LibraryStats {
  total_media: number
  total_movies: number
  total_shows: number
  total_audio_tracks: number
  total_subtitle_tracks: number
  total_size_gb: number
}
