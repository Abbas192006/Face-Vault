import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Heart, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getImageUrl, toggleBookmark, addPhotoTag, removePhotoTag, fetchTags } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'

export interface LightboxPhoto {
  filepath: string
  filename: string
  bookmarked?: boolean
  tags?: string[]
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[]
  initialIndex: number
  onClose: () => void
}

const PREDEFINED_TAGS = ['Friends', 'Family', 'VIP']

export function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({})
  const [localTags, setLocalTags] = useState<Record<string, string[]>>({})
  const [tagInputOpen, setTagInputOpen] = useState(false)
  const [newTagValue, setNewTagValue] = useState('')

  const currentPhoto = photos[currentIndex]
  const path = currentPhoto?.filepath
  const isBookmarked = localBookmarks[path] ?? currentPhoto?.bookmarked ?? false
  const tags = localTags[path] ?? currentPhoto?.tags ?? []

  // Initialize local state if missing
  useEffect(() => {
    if (currentPhoto && localBookmarks[path] === undefined && currentPhoto.bookmarked !== undefined) {
      setLocalBookmarks(prev => ({ ...prev, [path]: currentPhoto.bookmarked! }))
    }
    if (currentPhoto && localTags[path] === undefined && currentPhoto.tags !== undefined) {
      setLocalTags(prev => ({ ...prev, [path]: currentPhoto.tags! }))
    }
  }, [currentIndex, currentPhoto, path])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, photos.length])

  if (!currentPhoto) return null

  const handlePrev = () => {
    setTagInputOpen(false)
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setTagInputOpen(false)
    setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const handleBookmark = async () => {
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

  const handleAddTag = async (label: string) => {
    label = label.trim().toLowerCase()
    if (!label) return
    if (tags.includes(label)) {
      setTagInputOpen(false)
      setNewTagValue('')
      return
    }
    
    setLocalTags(prev => ({ ...prev, [path]: [...tags, label] }))
    setTagInputOpen(false)
    setNewTagValue('')
    
    try {
      await addPhotoTag(path, label)
      toast.success('Tag added')
    } catch {
      setLocalTags(prev => ({ ...prev, [path]: tags })) // revert
      toast.error('Failed to add tag')
    }
  }

  const handleRemoveTag = async (label: string) => {
    setLocalTags(prev => ({ ...prev, [path]: tags.filter(t => t !== label) }))
    try {
      await removePhotoTag(path, label)
      toast.success('Tag removed')
    } catch {
      setLocalTags(prev => ({ ...prev, [path]: tags })) // revert
      toast.error('Failed to remove tag')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Top Actions */}
      <div className="absolute top-4 right-4 flex gap-3 z-50" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2 bg-black/40 rounded-full p-1 backdrop-blur-md border border-white/10 flex-wrap justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-full text-white hover:bg-white/20 px-3"
            onClick={handleBookmark}
          >
            <Heart className={cn("h-4 w-4 mr-2", isBookmarked ? "fill-primary text-primary" : "text-white")} />
            {isBookmarked ? 'Liked' : 'Like'}
          </Button>

          {PREDEFINED_TAGS.map(t => (
            <Button
              key={t}
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 rounded-full px-3", 
                tags.includes(t.toLowerCase()) ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary" : "text-white hover:bg-white/20"
              )}
              onClick={() => tags.includes(t.toLowerCase()) ? handleRemoveTag(t.toLowerCase()) : handleAddTag(t)}
            >
              <Tag className="h-3 w-3 mr-1.5" />
              {t}
            </Button>
          ))}
          
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-white hover:bg-white/20 px-3"
              onClick={() => setTagInputOpen(!tagInputOpen)}
            >
              <Tag className="h-4 w-4 mr-2" />
              + Custom
            </Button>
            {tagInputOpen && (
              <div className="absolute top-full right-0 mt-2 bg-background/90 p-2 rounded-lg border border-primary/20 backdrop-blur w-48">
                <Input 
                  autoFocus
                  placeholder="Type tag & Enter..."
                  className="h-8 text-sm"
                  value={newTagValue}
                  onChange={e => setNewTagValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag(newTagValue)
                    if (e.key === 'Escape') setTagInputOpen(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 h-12 w-12 rounded-full bg-black/20"
        onClick={(e) => {
          e.stopPropagation()
          handlePrev()
        }}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 h-12 w-12 rounded-full bg-black/20"
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <motion.img
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        src={getImageUrl(path, false)}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        {tags.length > 0 && (
          <div className="flex gap-1">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="px-2 py-1 bg-black/60 text-white border-white/20 backdrop-blur-md flex items-center gap-1">
                {tag}
                <X className="h-3 w-3 cursor-pointer hover:text-error ml-1" onClick={() => handleRemoveTag(tag)} />
              </Badge>
            ))}
          </div>
        )}
        <div className="bg-black/60 px-6 py-2 rounded-full backdrop-blur-md text-white/80 font-mono text-sm">
          {currentIndex + 1} / {photos.length} — {currentPhoto.filename}
        </div>
      </div>
    </motion.div>
  )
}
