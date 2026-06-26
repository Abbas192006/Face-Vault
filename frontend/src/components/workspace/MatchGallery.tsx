import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ScanFace, Heart, Tag, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getImageUrl, toggleBookmark, addPhotoTag, removePhotoTag } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useSearchStore } from '@/stores/search-store'
import { useUIStore } from '@/stores/ui-store'
import { PhotoLightbox } from '@/components/shared/PhotoLightbox'
import { groupPhotosByMonth } from '@/lib/grouping'
import { toast } from 'sonner'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export function MatchGallery() {
  const { matches, hasSearched, selectedPaths, toggleSelection, setSelections, startDate, endDate, sortBy } = useSearchStore()
  const { galleryView, galleryFilter } = useUIStore()

  // Local state for tags and bookmarks to show immediate UI updates
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({})
  const [localTags, setLocalTags] = useState<Record<string, string[]>>({})

  // Lightbox & Selection state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [tagInputOpen, setTagInputOpen] = useState<string | null>(null)
  const [newTagValue, setNewTagValue] = useState('')
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(100)

  // Reset visible count when matches array changes (e.g. new search)
  useEffect(() => {
    setVisibleCount(100)
  }, [matches])

  if (hasSearched && matches.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        No matches found. Try adjusting strictness or uploading clearer selfies.
      </div>
    )
  }

  const filteredMatches = useMemo(() => {
    let result = matches.filter(match => {
      if (galleryFilter === 'portraits') return match.face_count === 1
      if (galleryFilter === 'groups') return match.face_count > 1
      return true
    })

    if (startDate || endDate) {
      result = result.filter((m) => {
        const cap = m.photo.captured_at
        if (!cap) return false
        const capString = cap.split('T')[0]
        if (startDate && capString < startDate) return false
        if (endDate && capString > endDate) return false
        return true
      })
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const t1 = a.photo.captured_at || ""
        const t2 = b.photo.captured_at || ""
        return t2.localeCompare(t1)
      })
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const t1 = a.photo.captured_at || ""
        const t2 = b.photo.captured_at || ""
        return t1.localeCompare(t2)
      })
    } else {
      result.sort((a, b) => a.distance - b.distance)
    }

    return result
  }, [matches, galleryFilter, startDate, endDate, sortBy])

  if (matches.length === 0) return null

  const handleBookmark = async (e: React.MouseEvent, path: string, isBookmarked: boolean) => {
    e.stopPropagation()
    const newValue = !isBookmarked
    setLocalBookmarks(prev => ({ ...prev, [path]: newValue }))
    try {
      await toggleBookmark(path, isBookmarked)
      toast.success(newValue ? 'Photo bookmarked' : 'Bookmark removed')
    } catch {
      setLocalBookmarks(prev => ({ ...prev, [path]: isBookmarked })) // revert
      toast.error('Failed to update bookmark')
    }
  }

  const handleAddTag = async (path: string, currentTags: string[]) => {
    if (!newTagValue.trim()) {
      setTagInputOpen(null)
      return
    }
    const label = newTagValue.trim().toLowerCase()
    if (currentTags.includes(label)) {
      setTagInputOpen(null)
      setNewTagValue('')
      return
    }
    
    setLocalTags(prev => ({ ...prev, [path]: [...currentTags, label] }))
    setTagInputOpen(null)
    setNewTagValue('')
    
    try {
      await addPhotoTag(path, label)
      toast.success('Tag added')
    } catch {
      setLocalTags(prev => ({ ...prev, [path]: currentTags })) // revert
      toast.error('Failed to add tag')
    }
  }

  const handleRemoveTag = async (e: React.MouseEvent, path: string, label: string, currentTags: string[]) => {
    e.stopPropagation()
    setLocalTags(prev => ({ ...prev, [path]: currentTags.filter(t => t !== label) }))
    try {
      await removePhotoTag(path, label)
      toast.success('Tag removed')
    } catch {
      setLocalTags(prev => ({ ...prev, [path]: currentTags })) // revert
      toast.error('Failed to remove tag')
    }
  }

  const handleSelect = (e: React.MouseEvent, path: string, idx: number) => {
    e.preventDefault()
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, idx)
      const end = Math.max(lastSelectedIndex, idx)
      const rangePaths = matches.slice(start, end + 1).map(m => m.photo.filepath)
      const newSelected = new Set(selectedPaths)
      
      // If the current clicked item is ALREADY selected, and we shift click, we might want to deselect the range?
      // Simple standard behavior: Shift-click adds the range to selection.
      rangePaths.forEach(p => newSelected.add(p))
      setSelections(Array.from(newSelected))
    } else {
      toggleSelection(path)
    }
    setLastSelectedIndex(idx)
  }

  const renderPhotoCard = (match: any, globalIdx: number) => {
    const path = match.photo.filepath
    const isSelected = selectedPaths.has(path)
    const score = Math.max(0, 100 - match.distance * 50).toFixed(1)
    const isBookmarked = localBookmarks[path] ?? match.bookmarked
    const tags = localTags[path] ?? match.tags ?? []

    return (
      <motion.div
        key={`${path}-${globalIdx}`}
        variants={itemVariants}
        whileHover={{ scale: 1.02, y: -4 }}
        onClick={(e) => handleSelect(e, path, globalIdx)}
        className={cn(
          'relative rounded-xl overflow-hidden glass-card image-card cursor-pointer border-2 transition-colors group',
          galleryView === 'grid' ? 'h-[300px]' : 'h-24 flex flex-row',
          isSelected ? 'border-primary scanner-glow' : 'border-transparent',
        )}
      >
        <img
          className={cn(
            'object-cover',
            galleryView === 'grid' ? 'w-full h-full' : 'w-24 h-full shrink-0',
          )}
          src={getImageUrl(path)}
          alt={match.photo.filename}
          loading="lazy"
          onClick={(e) => {
            e.stopPropagation()
            setLightboxIndex(globalIdx)
          }}
        />
        
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent image-hover-overlay',
            galleryView === 'list' && 'left-24',
          )}
        >
          {/* Top Action Bar */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/50 hover:bg-black/80 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                setTagInputOpen(tagInputOpen === path ? null : path)
              }}
            >
              <Tag className="h-4 w-4 text-white" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/50 hover:bg-black/80 rounded-full"
              onClick={(e) => handleBookmark(e, path, isBookmarked)}
            >
              <Heart className={cn("h-4 w-4", isBookmarked ? "fill-primary text-primary" : "text-white")} />
            </Button>
          </div>

          {tagInputOpen === path && (
            <div className="absolute top-12 right-2 bg-background/90 p-2 rounded-lg border border-primary/20 backdrop-blur" onClick={e => e.stopPropagation()}>
              <Input 
                autoFocus
                placeholder="Add tag..."
                className="h-8 text-sm"
                value={newTagValue}
                onChange={e => setNewTagValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTag(path, tags)
                }}
              />
            </div>
          )}

          {/* Bottom Info Bar */}
          <div className={cn("p-4 flex flex-col gap-1", galleryView === 'list' && 'justify-center h-full')}>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20">
                {score}% Match
              </Badge>
              {tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-black/50 border-white/10 flex items-center gap-1 group/tag">
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTag(e, path, tag, tags)
                    }}
                    className="opacity-0 group-hover/tag:opacity-100 transition-opacity ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between mt-1">
              <Badge variant="success">
                <ScanFace className="h-3 w-3 mr-1" />
                Match ({score}%)
              </Badge>
              <div className="text-on-surface/60 text-xs truncate max-w-[150px]">{match.photo.filename}</div>
            </div>
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute top-4 left-4">
            <Badge variant="success">
              <Check className="h-3 w-3 mr-1" />
              SELECTED
            </Badge>
          </div>
        )}
      </motion.div>
    )
  }

  const groupedMatches = useMemo(() => {
    const visibleMatches = filteredMatches.slice(0, visibleCount)
    if (sortBy === 'relevance') return null
    return groupPhotosByMonth(visibleMatches, m => m.photo.captured_at)
  }, [filteredMatches, visibleCount, sortBy])

  return (
    <>
      <div className="flex flex-col gap-8">
        {groupedMatches ? (
          groupedMatches.map((group) => (
            <motion.div 
              key={group.groupName} 
              className="flex flex-col gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-xl font-medium text-on-surface flex items-center gap-2 px-2 border-b border-border/50 pb-2">
                {group.groupName}
                <span className="text-sm text-on-surface-variant font-normal bg-surface px-2 py-0.5 rounded-full">
                  {group.items.length} photos
                </span>
              </h3>
              <div className={cn(
                galleryView === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter'
                  : 'flex flex-col gap-4',
              )}>
                {group.items.map((match) => {
                  const globalIdx = filteredMatches.indexOf(match)
                  return renderPhotoCard(match, globalIdx)
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              galleryView === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter'
                : 'flex flex-col gap-4',
            )}
          >
            {filteredMatches.slice(0, visibleCount).map((match, idx) => renderPhotoCard(match, idx))}
          </motion.div>
        )}
      </div>
      {filteredMatches.length > visibleCount && (
        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-on-surface-variant text-sm">
            Showing top {visibleCount} results out of {filteredMatches.length} matches.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + 100)}
            >
              Load More (+100)
            </Button>
            <Button
              variant="outline"
              onClick={() => setVisibleCount(filteredMatches.length)}
            >
              Show All
            </Button>
          </div>
        </div>
      )}
      
      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox 
            photos={filteredMatches.map(m => m.photo)}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
