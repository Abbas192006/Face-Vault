import { create } from 'zustand'
import { MAX_PROBE_FILES } from '@/lib/constants'

interface UploadState {
  previewUrls: string[]
  setFiles: (files: File[]) => File[]
  addFiles: (files: File[], currentFiles: File[]) => File[]
  removeFile: (index: number, currentFiles: File[]) => File[]
  revokePreviews: () => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  previewUrls: [],

  setFiles: (files) => {
    get().revokePreviews()
    const limited = files.slice(0, MAX_PROBE_FILES)
    const previewUrls = limited.map((f) => URL.createObjectURL(f))
    set({ previewUrls })
    return limited
  },

  addFiles: (files, currentFiles) => {
    const total = [...currentFiles, ...files]
    const limited = total.slice(0, MAX_PROBE_FILES)
    
    get().revokePreviews()
    const previewUrls = limited.map((f) => URL.createObjectURL(f))
    set({ previewUrls })
    return limited
  },

  removeFile: (index, currentFiles) => {
    const next = [...currentFiles]
    next.splice(index, 1)
    
    get().revokePreviews()
    const previewUrls = next.map((f) => URL.createObjectURL(f))
    set({ previewUrls })
    return next
  },

  revokePreviews: () => {
    get().previewUrls.forEach((url) => URL.revokeObjectURL(url))
    set({ previewUrls: [] })
  },
}))
