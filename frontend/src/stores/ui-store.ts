import { create } from 'zustand'

export type GalleryView = 'grid' | 'list'
export type GalleryFilter = 'all' | 'portraits' | 'groups' | 'objects'

interface UIState {
  galleryView: GalleryView
  galleryFilter: GalleryFilter
  sidebarOpen: boolean
  defaultStrictness: number

  setGalleryView: (view: GalleryView) => void
  setGalleryFilter: (filter: GalleryFilter) => void
  setSidebarOpen: (open: boolean) => void
  setDefaultStrictness: (value: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  galleryView: 'grid',
  galleryFilter: 'all',
  sidebarOpen: false,
  defaultStrictness: 0.6,

  setGalleryView: (view) => set({ galleryView: view }),
  setGalleryFilter: (filter) => set({ galleryFilter: filter }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDefaultStrictness: (value) => set({ defaultStrictness: value }),
}))
