import type { ChangeEvent } from 'react'
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useSearchStore } from '@/stores/search-store'
import { useUploadStore } from '@/stores/upload-store'
import { FolderPickerModal } from '@/components/shared/FolderPickerModal'
import { useState } from 'react'

export function SearchToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    probeFiles,
    targetFolder,
    strictness,
    isScanning,
    isDownloading,
    selectedPaths,
    setProbeFiles,
    setTargetFolder,
    setStrictness,
    runSearch,
    downloadSelected,
  } = useSearchStore()
  const { previewUrls, addFiles, removeFile } = useUploadStore()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = addFiles(Array.from(e.target.files), probeFiles)
      setProbeFiles(files)
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const files = removeFile(index, probeFiles)
    setProbeFiles(files)
  }

  const handleSearch = async () => {
    if (probeFiles.length === 0) {
      toast.error('Please select at least one selfie to find.')
      return
    }
    await runSearch()
  }

  return (
    <motion.div
      layout
      className="glass-card p-4 rounded-xl border border-primary/20 flex flex-col sm:flex-row gap-4 items-center justify-between"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          {previewUrls.map((url, i) => (
            <div key={url} className="relative group w-10 h-10 rounded-md overflow-hidden border border-primary/30">
              <img src={url} alt={`preview-${i}`} className="w-full h-full object-cover" />
              <div 
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                onClick={() => handleRemove(i)}
              >
                <span className="text-white text-xs font-bold">X</span>
              </div>
            </div>
          ))}
          
          {probeFiles.length < 5 && (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className={previewUrls.length > 0 ? "w-10 h-10 p-0" : ""}>
              <Upload className="h-4 w-4" />
              {previewUrls.length === 0 && <span className="ml-2">Upload Selfies</span>}
            </Button>
          )}
        </div>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-3 min-w-[180px]">
          <span className="text-on-surface-variant text-sm whitespace-nowrap">Strictness:</span>
          <Slider
            min={0.2}
            max={1.5}
            step={0.1}
            value={[strictness]}
            onValueChange={([v]) => setStrictness(v ?? 0.6)}
            className="flex-1"
          />
          <span className="text-primary text-sm font-mono w-8">{strictness.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <AnimatePresence>
          {selectedPaths.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button variant="secondary" onClick={downloadSelected} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Selected
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <Button onClick={handleSearch} disabled={isScanning}>
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      <div className="w-full sm:hidden">
        <TargetFolderInput />
      </div>
    </motion.div>
  )
}

export function TargetFolderInput() {
  const { targetFolder, setTargetFolder } = useSearchStore()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="flex gap-2 w-full">
        <Input
          type="text"
          placeholder="Select Target Directory..."
          value={targetFolder}
          readOnly
          className="rounded-full py-6 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />
        <Button variant="outline" className="rounded-full h-auto py-2 px-6" onClick={() => setIsOpen(true)}>
          Browse
        </Button>
      </div>
      {isOpen && (
        <FolderPickerModal
          onSelect={(path) => {
            setTargetFolder(path)
            setIsOpen(false)
          }}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
