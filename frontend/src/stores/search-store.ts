import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchResult } from '@/lib/api'
import {
  downloadZip,
  indexFolder,
  pollIndexStatus,
  searchFaces,
} from '@/lib/api'

interface Progress {
  processed: number
  total: number
  status: string
}

interface SearchState {
  probeFiles: File[]
  targetFolder: string
  strictness: number
  matches: MatchResult[]
  selectedPaths: Set<string>
  isScanning: boolean
  showScanOverlay: boolean
  progress: Progress
  hasSearched: boolean
  searchError: string
  isDownloading: boolean
  recentMatches: MatchResult[]
  startDate?: string
  endDate?: string
  sortBy: 'relevance' | 'newest' | 'oldest'

  setStartDate: (date?: string) => void
  setEndDate: (date?: string) => void
  setSortBy: (sort: 'relevance' | 'newest' | 'oldest') => void

  setProbeFiles: (files: File[]) => void
  setTargetFolder: (folder: string) => void
  setStrictness: (value: number) => void
  toggleSelection: (path: string) => void
  setSelections: (paths: string[]) => void
  clearSelection: () => void
  setShowScanOverlay: (show: boolean) => void
  runSearch: () => Promise<void>
  downloadSelected: () => Promise<void>
  resetSearch: () => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      probeFiles: [],
      targetFolder: '',
      strictness: 0.6,
      matches: [],
      selectedPaths: new Set(),
      isScanning: false,
      showScanOverlay: false,
      progress: { processed: 0, total: 0, status: '' },
      hasSearched: false,
      searchError: '',
      isDownloading: false,
      recentMatches: [],
      startDate: undefined,
      endDate: undefined,
      sortBy: 'relevance',

      setStartDate: (date) => set({ startDate: date }),
      setEndDate: (date) => set({ endDate: date }),
      setSortBy: (sort) => set({ sortBy: sort }),

      setProbeFiles: (files) => set({ probeFiles: files }),
      setTargetFolder: (folder) => set({ targetFolder: folder }),
      setStrictness: (value) => set({ strictness: value }),

      toggleSelection: (path) =>
        set((state) => {
          const next = new Set(state.selectedPaths)
          if (next.has(path)) next.delete(path)
          else next.add(path)
          return { selectedPaths: next }
        }),

      setSelections: (paths) => set({ selectedPaths: new Set(paths) }),

      clearSelection: () => set({ selectedPaths: new Set() }),

      setShowScanOverlay: (show) => set({ showScanOverlay: show }),

      resetSearch: () =>
        set({
          matches: [],
          selectedPaths: new Set(),
          hasSearched: false,
          searchError: '',
          progress: { processed: 0, total: 0, status: '' },
        }),

      runSearch: async () => {
        const { probeFiles, targetFolder, strictness } = get()
        if (probeFiles.length === 0) {
          set({ searchError: 'Please select at least one selfie to find.' })
          return
        }

        set({
          isScanning: true,
          showScanOverlay: true,
          hasSearched: false,
          searchError: '',
          matches: [],
          selectedPaths: new Set(),
        })

        try {
          if (targetFolder) {
            set({
              progress: { processed: 0, total: 0, status: 'Initializing Directory Index...' },
            })
            const { task_id } = await indexFolder(targetFolder)
            let done = false
            while (!done) {
              const status = await pollIndexStatus(task_id)
              set({
                progress: {
                  processed: status.processed,
                  total: status.total,
                  status: status.status,
                },
              })
              if (status.status === 'completed' || status.status === 'error') {
                done = true
              }
              if (!done) await new Promise((r) => setTimeout(r, 1000))
            }
          }

          set((s) => ({
            progress: { ...s.progress, status: 'Running Multi-Probe Neural Search...' },
          }))

          const matches = await searchFaces(probeFiles, strictness, targetFolder || undefined)
          set({
            matches,
            recentMatches: matches,
            hasSearched: true,
          })
        } catch (err) {
          set({
            searchError: err instanceof Error ? err.message : 'An error occurred.',
          })
        } finally {
          set({ isScanning: false, showScanOverlay: false })
        }
      },

      downloadSelected: async () => {
        const { selectedPaths } = get()
        if (selectedPaths.size === 0) return

        set({ isDownloading: true })
        try {
          const blob = await downloadZip(Array.from(selectedPaths))
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'FaceVault_Event_Album.zip'
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
        } catch {
          set({ searchError: 'ZIP download failed.' })
        } finally {
          set({ isDownloading: false })
        }
      },
    }),
    {
      name: 'facevault-recent',
      partialize: (state) => ({
        recentMatches: state.recentMatches,
        targetFolder: state.targetFolder,
        strictness: state.strictness,
      }),
    },
  ),
)
