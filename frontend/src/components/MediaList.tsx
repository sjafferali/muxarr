import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fetchMedia, fetchStats, syncMedia } from '../api/media'
import { IconSearch, IconFilm, IconAudio, IconSubtitle, IconHDD, IconSync } from './Icons'
import MediaCard from './MediaCard'

const MediaList: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'movies' | 'shows'>('all')

  const mediaTypeParam = filter === 'movies' ? 'movie' : filter === 'shows' ? 'show' : undefined

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['media', { media_type: mediaTypeParam, search }],
    queryFn: () =>
      fetchMedia({
        media_type: mediaTypeParam,
        search: search || undefined,
      }),
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })

  const syncMutation = useMutation({
    mutationFn: syncMedia,
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} media items`)
      queryClient.invalidateQueries({ queryKey: ['media'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: () => toast.error('Sync failed'),
  })

  const statsCards = [
    {
      label: 'Total Titles',
      value: stats?.total_media ?? 0,
      icon: <IconFilm />,
      color: 'text-violet-400',
    },
    {
      label: 'Audio Tracks',
      value: stats?.total_audio_tracks ?? 0,
      icon: <IconAudio />,
      color: 'text-emerald-300',
    },
    {
      label: 'Subtitle Tracks',
      value: stats?.total_subtitle_tracks ?? 0,
      icon: <IconSubtitle />,
      color: 'text-blue-300',
    },
    {
      label: 'Library Size',
      value: stats ? `${stats.total_size_gb.toFixed(1)} GB` : '0 GB',
      icon: <IconHDD />,
      color: 'text-pink-400',
    },
  ]

  return (
    <>
      {/* Search & Filter */}
      <div className="animate-fadeSlideIn mb-6 flex gap-3">
        <div className="flex h-[42px] flex-1 items-center gap-2.5 rounded-[10px] border border-white/[0.06] bg-[#1c1f26] px-3.5">
          <span className="text-[#4b5563]">
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media library..."
            className="flex-1 border-none bg-transparent text-[13px] text-[#e8eaed] outline-none placeholder:text-[#4b5563]"
          />
        </div>
        <div className="flex gap-0.5 rounded-[10px] border border-white/[0.06] bg-[#1c1f26] p-[3px]">
          {(['all', 'movies', 'shows'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-[7px] border-none px-4 py-1.5 text-xs font-bold capitalize transition-all duration-150 ${
                filter === f
                  ? 'bg-indigo-500/[0.15] text-indigo-400'
                  : 'bg-transparent text-[#6b7280] hover:text-[#9ca3af]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className={`flex cursor-pointer items-center gap-2 rounded-[10px] border border-white/[0.06] bg-[#1c1f26] px-4 text-xs font-bold text-[#6b7280] transition-all duration-150 hover:bg-white/[0.04] hover:text-[#9ca3af] disabled:cursor-not-allowed disabled:opacity-50 ${
            syncMutation.isPending ? 'animate-pulse' : ''
          }`}
        >
          <IconSync className={syncMutation.isPending ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* Stats Row */}
      <div
        className="animate-fadeSlideIn mb-7 grid grid-cols-4 gap-3"
        style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
      >
        {statsCards.map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border border-white/5 bg-[#1c1f26] px-[18px] py-4"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#4b5563]">
              {icon} {label}
            </div>
            <div className={`font-mono text-[22px] font-black tracking-tight ${color}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Media List */}
      <div className="overflow-hidden rounded-[14px] border border-white/5 bg-[#1c1f26]">
        <div className="border-b border-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#4b5563]">
          Media Library &middot; {media.length} result
          {media.length !== 1 ? 's' : ''}
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-[#4b5563]">Loading media library...</div>
        ) : media.length === 0 ? (
          <div className="py-12 text-center text-[#4b5563]">
            No media found matching your search.
          </div>
        ) : (
          <div className="p-1">
            {media.map((m, i) => (
              <MediaCard key={m.id} media={m} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default MediaList
