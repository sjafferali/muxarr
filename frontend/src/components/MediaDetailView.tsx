import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { AudioTrack, SubtitleTrack } from '../types/media'
import {
  fetchMediaDetail,
  setDefaultAudioTrack,
  setDefaultSubtitleTrack,
  removeAudioTrack,
  removeSubtitleTrack,
} from '../api/media'
import { IconBack, IconFilm, IconTv, IconAudio, IconSubtitle } from './Icons'
import TrackRow from './TrackRow'
import ConfirmModal from './ConfirmModal'

const MediaDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const mediaId = id!
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitle'>('audio')
  const [confirm, setConfirm] = useState<{
    title: string
    message: string
    danger: boolean
    onConfirm: () => void
  } | null>(null)

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', mediaId],
    queryFn: () => fetchMediaDetail(mediaId),
    enabled: !!mediaId,
  })

  const invalidateMedia = () => {
    queryClient.invalidateQueries({ queryKey: ['media', mediaId] })
    queryClient.invalidateQueries({ queryKey: ['media'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const setDefaultAudioMutation = useMutation({
    mutationFn: (streamIndex: number) => setDefaultAudioTrack(mediaId, streamIndex),
    onSuccess: () => {
      toast.success('Default audio track updated')
      invalidateMedia()
    },
    onError: () => toast.error('Failed to update default audio track'),
  })

  const setDefaultSubMutation = useMutation({
    mutationFn: (streamIndex: number) => setDefaultSubtitleTrack(mediaId, streamIndex),
    onSuccess: () => {
      toast.success('Default subtitle track updated')
      invalidateMedia()
    },
    onError: () => toast.error('Failed to update default subtitle track'),
  })

  const removeAudioMutation = useMutation({
    mutationFn: (streamIndex: number) => removeAudioTrack(mediaId, streamIndex),
    onSuccess: () => {
      toast.success('Audio track removed')
      invalidateMedia()
    },
    onError: () => toast.error('Failed to remove audio track'),
  })

  const removeSubMutation = useMutation({
    mutationFn: (streamIndex: number) => removeSubtitleTrack(mediaId, streamIndex),
    onSuccess: () => {
      toast.success('Subtitle track removed')
      invalidateMedia()
    },
    onError: () => toast.error('Failed to remove subtitle track'),
  })

  const handleRemoveAudio = (track: AudioTrack | SubtitleTrack) => {
    setConfirm({
      title: 'Remove Audio Track',
      message: `Remove "${track.title}" from this media file? This action cannot be undone.`,
      danger: true,
      onConfirm: () => {
        removeAudioMutation.mutate(track.stream_index)
        setConfirm(null)
      },
    })
  }

  const handleRemoveSub = (track: AudioTrack | SubtitleTrack) => {
    setConfirm({
      title: 'Remove Subtitle Track',
      message: `Remove "${track.title}" from this media file? This action cannot be undone.`,
      danger: true,
      onConfirm: () => {
        removeSubMutation.mutate(track.stream_index)
        setConfirm(null)
      },
    })
  }

  if (isLoading || !media) {
    return (
      <div className="animate-fadeSlideIn py-20 text-center text-[#4b5563]">
        Loading media details...
      </div>
    )
  }

  const tracks = activeTab === 'audio' ? media.audio_tracks : media.subtitle_tracks

  const infoPills = [
    { label: 'Quality', value: media.quality, color: 'text-yellow-400' },
    { label: 'Codec', value: media.video_codec, color: 'text-emerald-400' },
    { label: 'Container', value: media.container, color: 'text-blue-400' },
    { label: 'Size', value: media.size, color: 'text-pink-400' },
  ]

  return (
    <div className="animate-fadeSlideIn">
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 border-none bg-none py-2 text-[13px] font-semibold text-[#9ca3af] transition-colors hover:text-[#e8eaed]"
      >
        <IconBack /> {mediaId.startsWith('sonarr_ef_') ? 'Back to Series' : 'Back to Library'}
      </button>

      {/* Hero */}
      <div className="mb-8 flex gap-7 rounded-[14px] border border-white/5 bg-gradient-to-br from-[rgba(30,33,42,0.9)] to-[rgba(20,22,28,0.95)] p-6">
        {media.poster_url ? (
          <img
            src={media.poster_url}
            alt={media.title}
            className="h-[210px] w-[140px] flex-shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          <div className="flex h-[210px] w-[140px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#1c1f26] text-[#4b5563]">
            <IconFilm />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1 rounded-[5px] px-2.5 py-[3px] text-[10px] font-bold tracking-widest ${
                media.media_type === 'movie'
                  ? 'bg-violet-500/[0.15] text-violet-400'
                  : 'bg-blue-500/[0.15] text-blue-400'
              }`}
            >
              {media.media_type === 'movie' ? <IconFilm /> : <IconTv />}
              {media.media_type === 'episode' ? 'EPISODE' : media.media_type.toUpperCase()}
            </span>
            <span className="text-[11px] font-semibold text-[#6b7280]">{media.rating}</span>
          </div>
          <h2 className="mb-1 text-[26px] font-extrabold tracking-tight text-[#f3f4f6]">
            {media.title}
          </h2>
          <div className="mb-4 text-[13px] text-[#6b7280]">
            {media.year} &middot; {media.runtime}
          </div>
          <div className="flex flex-wrap gap-5">
            {infoPills.map(({ label, value, color }) => (
              <div key={label}>
                <div className="mb-[3px] text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">
                  {label}
                </div>
                <div className={`text-sm font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track Tabs */}
      <div className="mb-0.5 flex gap-0.5 px-1">
        {(['audio', 'subtitle'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative -bottom-px flex cursor-pointer items-center gap-2 rounded-t-[10px] px-5 py-3 text-[13px] font-bold transition-all duration-150 ${
              activeTab === tab
                ? 'border border-white/[0.06] border-b-[#1c1f26] bg-[#1c1f26] text-[#e8eaed]'
                : 'border border-transparent border-b-white/[0.06] bg-transparent text-[#6b7280]'
            }`}
          >
            {tab === 'audio' ? <IconAudio /> : <IconSubtitle />}
            {tab === 'audio' ? 'Audio Tracks' : 'Subtitle Tracks'}
            <span
              className={`rounded-[10px] px-2 py-0.5 text-[11px] font-extrabold ${
                activeTab === tab
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-white/[0.06] text-[#6b7280]'
              }`}
            >
              {tab === 'audio' ? media.audio_tracks.length : media.subtitle_tracks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Track Table */}
      <div className="overflow-hidden rounded-[0_12px_12px_12px] border border-white/[0.06] bg-[#1c1f26]">
        {/* Header */}
        <div
          className="grid h-10 items-center border-b border-white/[0.06] px-5 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]"
          style={{
            gridTemplateColumns:
              activeTab === 'audio'
                ? '44px 1fr 110px 80px 100px 90px'
                : '44px 1fr 80px 80px 80px 90px',
          }}
        >
          <span></span>
          <span>Track</span>
          {activeTab === 'audio' ? (
            <>
              <span>Codec</span>
              <span>Channels</span>
              <span>Bitrate</span>
            </>
          ) : (
            <>
              <span>Format</span>
              <span>Language</span>
              <span>Flags</span>
            </>
          )}
          <span className="text-right">Actions</span>
        </div>
        {/* Rows */}
        {tracks.map((track, i) => (
          <TrackRow
            key={track.stream_index}
            track={track}
            type={activeTab}
            isDefault={track.is_default}
            onSetDefault={
              activeTab === 'audio'
                ? (streamIndex) => setDefaultAudioMutation.mutate(streamIndex)
                : (streamIndex) => setDefaultSubMutation.mutate(streamIndex)
            }
            onRemove={activeTab === 'audio' ? handleRemoveAudio : handleRemoveSub}
            isLast={i === tracks.length - 1}
          />
        ))}
        {tracks.length === 0 && (
          <div className="py-10 text-center text-[13px] text-[#4b5563]">
            No {activeTab} tracks remaining.
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaDetailView
