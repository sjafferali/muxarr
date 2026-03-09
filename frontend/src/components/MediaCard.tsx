import React, { useState } from 'react'
import type { MediaItem } from '../types/media'
import { IconFilm, IconTv, IconAudio, IconSubtitle, IconHDD, IconChevronRight } from './Icons'

interface MediaCardProps {
  media: MediaItem
  onClick: () => void
  index: number
}

const MediaCard: React.FC<MediaCardProps> = ({ media, onClick, index }) => {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`animate-fadeSlideIn flex cursor-pointer gap-4 rounded-xl p-4 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] ${
        hovered ? 'translate-x-1 bg-white/[0.025]' : 'bg-transparent'
      }`}
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
    >
      {!imgError && media.poster_url ? (
        <img
          src={media.poster_url}
          alt={media.title}
          onError={() => setImgError(true)}
          className="h-[84px] w-14 flex-shrink-0 rounded-lg border border-white/[0.06] object-cover"
        />
      ) : (
        <div className="flex h-[84px] w-14 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#1c1f26] text-[#4b5563]">
          <IconFilm />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate text-[15px] font-bold text-[#e8eaed]">{media.title}</span>
          <span className="flex-shrink-0 text-xs text-[#6b7280]">{media.year}</span>
        </div>
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded px-[7px] py-0.5 text-[9px] font-bold tracking-wider ${
              media.media_type === 'movie'
                ? 'bg-violet-500/[0.12] text-violet-400'
                : 'bg-blue-500/[0.12] text-blue-400'
            }`}
          >
            {media.media_type === 'movie' ? <IconFilm /> : <IconTv />}
            {media.media_type.toUpperCase()}
          </span>
          <span className="rounded bg-yellow-400/10 px-[7px] py-0.5 text-[9px] font-bold tracking-wider text-yellow-400">
            {media.quality}
          </span>
          <span className="rounded bg-emerald-400/10 px-[7px] py-0.5 text-[9px] font-bold tracking-wider text-emerald-400">
            {media.video_codec}
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-[11px] text-[#6b7280]">
          <span className="flex items-center gap-1">
            <IconAudio /> {media.audio_track_count} audio
          </span>
          <span className="flex items-center gap-1">
            <IconSubtitle /> {media.subtitle_track_count} subs
          </span>
          <span className="flex items-center gap-1">
            <IconHDD /> {media.size}
          </span>
        </div>
      </div>
      <div
        className={`flex items-center transition-colors duration-150 ${
          hovered ? 'text-[#6b7280]' : 'text-[#3b3f4a]'
        }`}
      >
        <IconChevronRight />
      </div>
    </div>
  )
}

export default MediaCard
