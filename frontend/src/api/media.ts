import axios from 'axios'
import type { MediaItem, MediaDetail, LibraryStats } from '../types/media'

const api = axios.create({ baseURL: '/api/v1' })

export async function fetchMedia(params?: {
  media_type?: string
  search?: string
}): Promise<MediaItem[]> {
  const { data } = await api.get('/media', { params })
  return data
}

export async function fetchMediaDetail(id: number): Promise<MediaDetail> {
  const { data } = await api.get(`/media/${id}`)
  return data
}

export async function fetchStats(): Promise<LibraryStats> {
  const { data } = await api.get('/media/stats')
  return data
}

export async function setDefaultAudioTrack(mediaId: number, trackId: number): Promise<void> {
  await api.post(`/media/${mediaId}/tracks/audio/${trackId}/default`)
}

export async function setDefaultSubtitleTrack(mediaId: number, trackId: number): Promise<void> {
  await api.post(`/media/${mediaId}/tracks/subtitle/${trackId}/default`)
}

export async function removeAudioTrack(mediaId: number, trackId: number): Promise<void> {
  await api.delete(`/media/${mediaId}/tracks/audio/${trackId}`)
}

export async function removeSubtitleTrack(mediaId: number, trackId: number): Promise<void> {
  await api.delete(`/media/${mediaId}/tracks/subtitle/${trackId}`)
}

export async function syncMedia(): Promise<{
  synced: number
  errors: string[]
}> {
  const { data } = await api.post('/media/sync')
  return data
}
