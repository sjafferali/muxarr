import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchStats } from './api/media'
import MediaList from './components/MediaList'
import MediaDetailView from './components/MediaDetailView'

function App() {
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })

  return (
    <div className="min-h-screen bg-[#12141a] font-sans text-[#e8eaed]">
      {/* Header */}
      <header className="sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-white/5 bg-[#12141a]/90 px-8 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black tracking-tight text-white">
            M
          </div>
          <span className="text-[17px] font-extrabold tracking-tight">
            Mux<span className="text-indigo-400">arr</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#6b7280]">
          <span>{stats?.total_media ?? 0} titles</span>
          <span className="h-4 w-px bg-[#2a2d36]" />
          <span>{stats?.total_audio_tracks ?? 0} audio</span>
          <span>{stats?.total_subtitle_tracks ?? 0} subs</span>
          <span className="h-4 w-px bg-[#2a2d36]" />
          <span>{stats?.total_size_gb?.toFixed(1) ?? '0.0'} GB</span>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-6 pb-20 pt-6">
        {selectedMediaId !== null ? (
          <MediaDetailView mediaId={selectedMediaId} onBack={() => setSelectedMediaId(null)} />
        ) : (
          <MediaList onSelectMedia={(id) => setSelectedMediaId(id)} />
        )}
      </div>
    </div>
  )
}

export default App
