import { API_BASE } from './constants'

export interface PhotoMeta {
  filepath: string
  filename: string
  face_index?: number
}

export interface MatchResult {
  distance: number
  photo: PhotoMeta
  bookmarked: boolean
  tags: string[]
}

export interface IndexStatus {
  status: string
  total: number
  processed: number
}

export interface HistoryEntry {
  searched_at: string
  folder_scanned: string
  match_count: number
  probe_filename?: string
}

export function getImageUrl(path: string, thumbnail = true): string {
  const params = new URLSearchParams({ path })
  if (thumbnail) params.set('thumbnail', 'true')
  return `${API_BASE}/image?${params.toString()}`
}

export async function indexFolder(path: string): Promise<{ task_id: string }> {
  const res = await fetch(`${API_BASE}/index?path=${encodeURIComponent(path)}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to start indexing')
  return res.json()
}

export async function pollIndexStatus(taskId: string): Promise<IndexStatus> {
  const res = await fetch(`${API_BASE}/status/${taskId}`)
  if (!res.ok) throw new Error('Failed to poll index status')
  return res.json()
}

export async function searchFaces(
  files: File[],
  threshold: number,
  folderPath?: string,
): Promise<MatchResult[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  formData.append('threshold', threshold.toString())
  if (folderPath) formData.append('folder_path', folderPath)

  const res = await fetch(`${API_BASE}/search`, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Search failed' }))
    throw new Error(err.detail ?? 'Search failed')
  }
  const data = await res.json()
  return data.matches ?? []
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE}/history`)
  if (!res.ok) throw new Error('Failed to load history')
  const data = await res.json()
  return data.history ?? []
}

export async function downloadZip(files: string[]): Promise<Blob> {
  const res = await fetch(`${API_BASE}/download_zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  })
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

// New types
export interface EventData {
  id: number
  name: string
  folder_path: string
  description: string
  photo_count: number
  face_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface StatsData {
  total_photos: number
  total_faces: number
  total_searches: number
  total_events: number
  total_bookmarks: number
  db_size_bytes: number
  index_size_bytes: number
  db_size_mb: number
  index_size_mb: number
}

export interface BookmarkData {
  id: number
  photo_id: number
  filepath: string
  filename: string
  created_at: string
}

// New functions
export async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchEvents(): Promise<EventData[]> {
  const res = await fetch(`${API_BASE}/events`)
  if (!res.ok) throw new Error('Failed to fetch events')
  const data = await res.json()
  return data.events ?? []
}

export async function createEvent(name: string, folder_path: string, description: string): Promise<EventData> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, folder_path, description }),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function deleteEvent(eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}

export async function indexEvent(eventId: number): Promise<{ task_id: string }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/index`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to start indexing')
  return res.json()
}

export async function toggleBookmark(filepath: string, bookmarked: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: bookmarked ? 'DELETE' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath }),
  })
  if (!res.ok) throw new Error('Failed to toggle bookmark')
}

export async function fetchBookmarks(): Promise<BookmarkData[]> {
  const res = await fetch(`${API_BASE}/bookmarks`)
  if (!res.ok) throw new Error('Failed to fetch bookmarks')
  const data = await res.json()
  return data.bookmarks ?? []
}

export async function addPhotoTag(filepath: string, label: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, label }),
  })
  if (!res.ok) throw new Error('Failed to add tag')
}

export async function removePhotoTag(filepath: string, label: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tags`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, label }),
  })
  if (!res.ok) throw new Error('Failed to remove tag')
}

export async function deleteHistoryEntry(historyId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${historyId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete history entry')
}

export async function clearAllHistory(): Promise<void> {
  const res = await fetch(`${API_BASE}/history/clear`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to clear history')
}

export async function nukeAllData(): Promise<void> {
  const res = await fetch(`${API_BASE}/nuke`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to reset data')
}
