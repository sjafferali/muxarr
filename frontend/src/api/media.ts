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

export async function fetchMediaDetail(id: string): Promise<MediaDetail> {
  const { data } = await api.get(`/media/${id}`)
  return data
}

export async function fetchStats(): Promise<LibraryStats> {
  const { data } = await api.get('/media/stats')
  return data
}

export async function setDefaultAudioTrack(mediaId: string, streamIndex: number): Promise<void> {
  await api.post(`/media/${mediaId}/tracks/audio/${streamIndex}/default`)
}

export async function setDefaultSubtitleTrack(
  mediaId: string,
  streamIndex: number
): Promise<void> {
  await api.post(`/media/${mediaId}/tracks/subtitle/${streamIndex}/default`)
}

export async function removeAudioTrack(mediaId: string, streamIndex: number): Promise<void> {
  await api.delete(`/media/${mediaId}/tracks/audio/${streamIndex}`)
}

export async function removeSubtitleTrack(mediaId: string, streamIndex: number): Promise<void> {
  await api.delete(`/media/${mediaId}/tracks/subtitle/${streamIndex}`)
}
