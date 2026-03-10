import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { EpisodeFile } from '../types/media'
import { fetchMediaDetail, fetchEpisodes } from '../api/media'
import {
  IconBack,
  IconFilm,
  IconTv,
  IconAudio,
  IconSubtitle,
  IconHDD,
  IconChevronRight,
} from './Icons'

function formatEpisodeLabel(ep: EpisodeFile): string {
  if (ep.episode_numbers.length === 1) {
    return `E${String(ep.episode_numbers[0]).padStart(2, '0')}`
  }
  return `E${String(ep.episode_numbers[0]).padStart(2, '0')}-E${String(ep.episode_numbers[ep.episode_numbers.length - 1]).padStart(2, '0')}`
}

interface SeasonSectionProps {
  seasonNumber: number
  episodes: EpisodeFile[]
  defaultExpanded: boolean
}

const SeasonSection: React.FC<SeasonSectionProps> = ({
  seasonNumber,
  episodes,
  defaultExpanded,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-3 border-0 border-b border-solid border-white/[0.06] bg-white/[0.02] px-5 py-3 text-left transition-colors hover:bg-white/[0.04]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[#6b7280] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-[13px] font-bold text-[#e8eaed]">Season {seasonNumber}</span>
        <span className="rounded-[10px] bg-white/[0.06] px-2 py-0.5 text-[11px] font-extrabold text-[#6b7280]">
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
        </span>
      </button>
      {expanded && (
        <div>
          {episodes.map((ep, i) => (
            <EpisodeRow key={ep.id} episode={ep} isLast={i === episodes.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface EpisodeRowProps {
  episode: EpisodeFile
  isLast: boolean
}

const EpisodeRow: React.FC<EpisodeRowProps> = ({ episode, isLast }) => {
  const [hovered, setHovered] = useState(false)
  const epLabel = formatEpisodeLabel(episode)

  return (
    <Link
      to={`/media/${episode.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid items-center px-5 py-3 no-underline transition-colors duration-150 ${
        hovered ? 'bg-white/[0.03]' : 'bg-transparent'
      } ${!isLast ? 'border-0 border-b border-solid border-white/[0.04]' : ''}`}
      style={{ gridTemplateColumns: '60px 1fr auto auto' }}
    >
      <span className="text-[13px] font-extrabold tabular-nums text-indigo-400">{epLabel}</span>
      <span className="min-w-0 truncate pr-4 text-[13px] font-medium text-[#e8eaed]">
        {episode.episode_title}
      </span>
      <div className="flex items-center gap-4 pr-3 text-[11px] text-[#6b7280]">
        <span className="flex items-center gap-1">
          <IconAudio /> {episode.audio_track_count}
        </span>
        <span className="flex items-center gap-1">
          <IconSubtitle /> {episode.subtitle_track_count}
        </span>
        <span className="flex items-center gap-1">
          <IconHDD /> {episode.size}
        </span>
        <span className="rounded bg-yellow-400/10 px-[6px] py-0.5 text-[9px] font-bold tracking-wider text-yellow-400">
          {episode.quality}
        </span>
      </div>
      <div
        className={`transition-colors duration-150 ${hovered ? 'text-[#6b7280]' : 'text-[#3b3f4a]'}`}
      >
        <IconChevronRight />
      </div>
    </Link>
  )
}

const SeriesDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const seriesId = id!

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ['media', seriesId],
    queryFn: () => fetchMediaDetail(seriesId),
    enabled: !!seriesId,
  })

  const { data: episodes = [], isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', seriesId],
    queryFn: () => fetchEpisodes(seriesId),
    enabled: !!seriesId,
  })

  if (seriesLoading || episodesLoading || !series) {
    return (
      <div className="animate-fadeSlideIn py-20 text-center text-[#4b5563]">Loading series...</div>
    )
  }

  // Group episodes by season
  const seasonMap = new Map<number, EpisodeFile[]>()
  for (const ep of episodes) {
    const existing = seasonMap.get(ep.season_number)
    if (existing) {
      existing.push(ep)
    } else {
      seasonMap.set(ep.season_number, [ep])
    }
  }
  const seasons = Array.from(seasonMap.entries()).sort(([a], [b]) => a - b)

  const infoPills = [
    { label: 'Quality', value: series.quality, color: 'text-yellow-400' },
    { label: 'Codec', value: series.video_codec, color: 'text-emerald-400' },
    { label: 'Container', value: series.container, color: 'text-blue-400' },
    { label: 'Size', value: series.size, color: 'text-pink-400' },
  ]

  return (
    <div className="animate-fadeSlideIn">
      <button
        onClick={() => navigate('/')}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 border-none bg-none py-2 text-[13px] font-semibold text-[#9ca3af] transition-colors hover:text-[#e8eaed]"
      >
        <IconBack /> Back to Library
      </button>

      {/* Hero */}
      <div className="mb-8 flex gap-7 rounded-[14px] border border-white/5 bg-gradient-to-br from-[rgba(30,33,42,0.9)] to-[rgba(20,22,28,0.95)] p-6">
        {series.poster_url ? (
          <img
            src={series.poster_url}
            alt={series.title}
            className="h-[210px] w-[140px] flex-shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          <div className="flex h-[210px] w-[140px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#1c1f26] text-[#4b5563]">
            <IconFilm />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-[5px] bg-blue-500/[0.15] px-2.5 py-[3px] text-[10px] font-bold tracking-widest text-blue-400">
              <IconTv />
              SHOW
            </span>
            {series.rating && (
              <span className="text-[11px] font-semibold text-[#6b7280]">{series.rating}</span>
            )}
          </div>
          <h2 className="mb-1 text-[26px] font-extrabold tracking-tight text-[#f3f4f6]">
            {series.title}
          </h2>
          <div className="mb-4 text-[13px] text-[#6b7280]">
            {series.year} &middot; {seasons.length} Season{seasons.length !== 1 ? 's' : ''} &middot;{' '}
            {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
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

      {/* Episodes */}
      <div className="overflow-hidden rounded-[14px] border border-white/5 bg-[#1c1f26]">
        <div className="border-b border-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#4b5563]">
          Episodes &middot; {episodes.length} file{episodes.length !== 1 ? 's' : ''}
        </div>
        {episodes.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#4b5563]">
            No episode files found.
          </div>
        ) : (
          seasons.map(([seasonNum, seasonEpisodes]) => (
            <SeasonSection
              key={seasonNum}
              seasonNumber={seasonNum}
              episodes={seasonEpisodes}
              defaultExpanded={seasons.length <= 3}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default SeriesDetailView
