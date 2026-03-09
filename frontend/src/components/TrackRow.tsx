import React, { useState } from 'react'
import type { AudioTrack, SubtitleTrack } from '../types/media'
import { IconCheck, IconTrash } from './Icons'

const FLAG_MAP: Record<string, string> = {
  eng: '\u{1F1EC}\u{1F1E7}',
  spa: '\u{1F1EA}\u{1F1F8}',
  fra: '\u{1F1EB}\u{1F1F7}',
  deu: '\u{1F1E9}\u{1F1EA}',
  jpn: '\u{1F1EF}\u{1F1F5}',
  por: '\u{1F1E7}\u{1F1F7}',
  ita: '\u{1F1EE}\u{1F1F9}',
}

interface TrackRowProps {
  track: AudioTrack | SubtitleTrack
  type: 'audio' | 'subtitle'
  isDefault: boolean
  onSetDefault: (trackId: number) => void
  onRemove: (track: AudioTrack | SubtitleTrack) => void
  isLast?: boolean
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  type,
  isDefault,
  onSetDefault,
  onRemove,
  isLast = false,
}) => {
  const [hovered, setHovered] = useState(false)
  const langCode = 'language_code' in track ? track.language_code : null
  const flag = langCode ? FLAG_MAP[langCode] || '\u{1F3F3}\u{FE0F}' : '\u{1F3F3}\u{FE0F}'

  const audioTrack = track as AudioTrack
  const subtitleTrack = track as SubtitleTrack

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid h-12 items-center px-5 text-[13px] transition-colors duration-150 ${
        hovered ? 'bg-white/[0.02]' : 'bg-transparent'
      } ${!isLast ? 'border-b border-white/[0.04]' : ''}`}
      style={{
        gridTemplateColumns:
          type === 'audio' ? '44px 1fr 110px 80px 100px 90px' : '44px 1fr 80px 80px 80px 90px',
      }}
    >
      <span className="text-lg">{flag}</span>
      <span className="truncate pr-3 font-medium text-[#e8eaed]">{track.title}</span>
      {type === 'audio' ? (
        <>
          <span className="text-[11px] font-semibold tracking-wider text-emerald-300">
            {audioTrack.codec}
          </span>
          <span className="text-[#9ca3af]">{audioTrack.channels}</span>
          <span className="text-xs text-[#6b7280]">{audioTrack.bitrate}</span>
        </>
      ) : (
        <>
          <span className="text-[11px] font-semibold tracking-wider text-blue-300">
            {subtitleTrack.format}
          </span>
          <span className="text-[#9ca3af]">{subtitleTrack.language}</span>
          {subtitleTrack.forced ? (
            <span className="w-fit rounded bg-yellow-400/[0.12] px-2 py-0.5 text-[10px] font-bold tracking-widest text-yellow-400">
              FORCED
            </span>
          ) : (
            <span />
          )}
        </>
      )}
      <div className="flex justify-end gap-1.5">
        {isDefault ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-500/[0.12] px-2.5 py-1 text-[10px] font-bold tracking-widest text-green-500">
            <IconCheck /> DEFAULT
          </span>
        ) : (
          <button
            onClick={() => onSetDefault(track.id)}
            title="Set as default"
            className={`flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-[#6b7280] transition-all duration-150 hover:bg-white/[0.08] hover:text-[#9ca3af] ${
              hovered ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <IconCheck />
          </button>
        )}
        <button
          onClick={() => onRemove(track)}
          title="Remove track"
          className={`flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border border-red-600/[0.15] bg-red-600/[0.08] text-red-500 transition-all duration-150 hover:bg-red-600/[0.15] ${
            hovered ? 'opacity-100' : 'opacity-30'
          }`}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

export default TrackRow
