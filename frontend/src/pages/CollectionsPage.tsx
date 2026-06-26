import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Heart, Tag as TagIcon, Hash, Loader2, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchBookmarks, fetchTags, fetchPhotosByTag, getImageUrl, downloadZip, type BookmarkData } from '@/lib/api'
import { PhotoLightbox, type LightboxPhoto } from '@/components/shared/PhotoLightbox'
import { FilterSortMenu } from '@/components/shared/FilterSortMenu'
import { groupPhotosByMonth } from '@/lib/grouping'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'

type TabState = 'favorites' | 'tags'

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<TabState>('favorites')
  
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [tagsList, setTagsList] = useState<{label: string, count: number}[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [taggedPhotos, setTaggedPhotos] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([])

  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest'>('relevance')

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const filterAndSortPhotos = (photos: any[]) => {
    let result = [...photos]
    if (startDate || endDate) {
      result = result.filter((p) => {
        const cap = p.captured_at
        if (!cap) return false
        const capString = cap.split('T')[0]
        if (startDate && capString < startDate) return false
        if (endDate && capString > endDate) return false
        return true
      })
    }
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const t1 = a.captured_at || ""
        const t2 = b.captured_at || ""
        return t2.localeCompare(t1)
      })
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const t1 = a.captured_at || ""
        const t2 = b.captured_at || ""
        return t1.localeCompare(t2)
      })
    }
    return result
  }

  const filteredBookmarks = useMemo(() => filterAndSortPhotos(bookmarks), [bookmarks, startDate, endDate, sortBy])
  const filteredTaggedPhotos = useMemo(() => filterAndSortPhotos(taggedPhotos), [taggedPhotos, startDate, endDate, sortBy])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedPaths(new Set())
    setLastSelectedIndex(null)
  }, [activeTab, selectedTag])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bmks, tgs] = await Promise.all([fetchBookmarks(), fetchTags()])
      setBookmarks(bmks)
      setTagsList(tgs)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleTagClick = async (label: string) => {
    setSelectedTag(label)
    setLoading(true)
    try {
      const photos = await fetchPhotosByTag(label)
      setTaggedPhotos(photos)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const openLightbox = (photos: any[], index: number) => {
    const lPhotos = photos.map(p => ({
      filepath: p.filepath,
      filename: p.filename,
      bookmarked: p.bookmarked ?? (activeTab === 'favorites' ? true : undefined),
    }))
    setLightboxPhotos(lPhotos)
    setLightboxIndex(index)
  }

  const handleSelect = (e: React.MouseEvent, path: string, idx: number, list: any[]) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, idx)
      const end = Math.max(lastSelectedIndex, idx)
      const rangePaths = list.slice(start, end + 1).map(p => p.filepath)
      const newSelected = new Set(selectedPaths)
      rangePaths.forEach(p => newSelected.add(p))
      setSelectedPaths(newSelected)
    } else {
      const newSelected = new Set(selectedPaths)
      if (newSelected.has(path)) {
        newSelected.delete(path)
      } else {
        newSelected.add(path)
      }
      setSelectedPaths(newSelected)
    }
    setLastSelectedIndex(idx)
  }

  const handleDownloadSelected = async () => {
    if (selectedPaths.size === 0) return
    setIsDownloading(true)
    try {
      const blob = await downloadZip(Array.from(selectedPaths))
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'FaceVault_Collection.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSelectedPaths(new Set())
    } catch {
      toast.error('Failed to download ZIP.')
    } finally {
      setIsDownloading(false)
    }
  }

  const renderPhotoCard = (photo: any, globalList: any[], isTag: boolean) => {
    const path = photo.filepath
    const globalIdx = globalList.indexOf(photo)
    const isSelected = selectedPaths.has(path)
    
    return (
      <motion.div 
        key={path}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "aspect-square bg-surface rounded-xl overflow-hidden cursor-pointer relative group border-2 transition-colors",
          isSelected ? "border-primary" : "border-transparent"
        )}
        onClick={() => openLightbox(globalList, globalIdx)}
      >
        <img 
          src={getImageUrl(path)} 
          alt={photo.filename}
          className={cn("w-full h-full object-cover transition-transform duration-300", !isSelected && "group-hover:scale-105")}
        />
        {!isTag && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="h-5 w-5 fill-primary text-primary" />
          </div>
        )}
        
        <div 
          className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10",
            isSelected 
              ? "bg-primary border-primary text-background" 
              : "bg-black/20 border-white/50 text-transparent opacity-0 group-hover:opacity-100 hover:bg-black/40 hover:border-white"
          )}
          onClick={(e) => handleSelect(e, path, globalIdx, globalList)}
        >
          <Check className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
              <FolderHeart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                Collections
              </h1>
              <p className="text-on-surface-variant font-body-md text-body-md">
                Your saved and tagged photos
              </p>
            </div>
          </div>
          
          <AnimatePresence>
            {selectedPaths.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-4 py-2 rounded-xl"
              >
                <span className="text-sm font-medium text-primary">
                  {selectedPaths.size} selected
                </span>
                <Button 
                  size="sm" 
                  onClick={handleDownloadSelected}
                  disabled={isDownloading}
                  className="h-8 shadow-glow"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download Zip
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => setSelectedPaths(new Set())}
                >
                  Cancel
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4">
            <Button 
              variant={activeTab === 'favorites' ? 'default' : 'outline'}
              onClick={() => { setActiveTab('favorites'); setSelectedTag(null); loadData(); }}
            >
              <Heart className={cn("h-4 w-4 mr-2", activeTab === 'favorites' ? "fill-white" : "")} />
              Favorites
            </Button>
            <Button 
              variant={activeTab === 'tags' ? 'default' : 'outline'}
              onClick={() => { setActiveTab('tags'); setSelectedTag(null); loadData(); }}
            >
              <TagIcon className="h-4 w-4 mr-2" />
              Tags
            </Button>
          </div>

          <FilterSortMenu
            startDate={startDate}
            endDate={endDate}
            sortBy={sortBy}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSortChange={setSortBy}
          />
        </div>

        {loading && <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

        {!loading && activeTab === 'favorites' && (
          <div>
            {bookmarks.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant bg-black/20 rounded-xl border border-white/5">
                No favorites yet. Like photos to see them here.
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="col-span-full py-20 text-center text-on-surface-variant">
                No favorites match your filters.
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {sortBy !== 'relevance' ? (
                  groupPhotosByMonth(filteredBookmarks, m => m.captured_at || undefined).map(group => (
                    <motion.div key={group.groupName} className="flex flex-col gap-4">
                      <h3 className="text-xl font-medium text-on-surface flex items-center gap-2 px-2 border-b border-border/50 pb-2">
                        {group.groupName}
                        <span className="text-sm text-on-surface-variant font-normal bg-surface px-2 py-0.5 rounded-full">
                          {group.items.length} photos
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {group.items.map(photo => renderPhotoCard(photo, filteredBookmarks, false))}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredBookmarks.map(photo => renderPhotoCard(photo, filteredBookmarks, false))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'tags' && !selectedTag && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-on-surface">All Tags</h2>
            {tagsList.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant bg-black/20 rounded-xl border border-white/5">
                No tags yet. Tag photos to see them here.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tagsList.map(t => (
                  <div 
                    key={t.label}
                    className="flex items-center justify-between p-4 bg-surface rounded-xl border border-white/10 hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => handleTagClick(t.label)}
                  >
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-primary" />
                      <span className="font-medium text-on-surface capitalize">{t.label}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant bg-black/40 px-2 py-1 rounded-full">{t.count} photos</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'tags' && selectedTag && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" onClick={() => setSelectedTag(null)}>
                ← Back to Tags
              </Button>
              <h2 className="text-xl font-semibold text-on-surface capitalize border-l border-white/20 pl-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" /> {selectedTag} 
                <span className="text-sm font-normal text-on-surface-variant ml-2">({taggedPhotos.length} photos)</span>
              </h2>
            </div>

            <div className="flex flex-col gap-8">
              {sortBy !== 'relevance' ? (
                groupPhotosByMonth(filteredTaggedPhotos, m => m.captured_at || undefined).map(group => (
                  <motion.div key={group.groupName} className="flex flex-col gap-4">
                    <h3 className="text-xl font-medium text-on-surface flex items-center gap-2 px-2 border-b border-border/50 pb-2">
                      {group.groupName}
                      <span className="text-sm text-on-surface-variant font-normal bg-surface px-2 py-0.5 rounded-full">
                        {group.items.length} photos
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {group.items.map(photo => renderPhotoCard(photo, filteredTaggedPhotos, true))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredTaggedPhotos.map(photo => renderPhotoCard(photo, filteredTaggedPhotos, true))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox 
            photos={lightboxPhotos}
            initialIndex={lightboxIndex}
            onClose={() => {
              setLightboxIndex(null)
              if (activeTab === 'tags' && selectedTag) handleTagClick(selectedTag)
              else loadData()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
