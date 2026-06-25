import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Heart, Tag as TagIcon, Hash, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchBookmarks, fetchTags, fetchPhotosByTag, getImageUrl, type BookmarkData } from '@/lib/api'
import { PhotoLightbox, type LightboxPhoto } from '@/components/shared/PhotoLightbox'
import { cn } from '@/lib/cn'

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

  useEffect(() => {
    loadData()
  }, [])

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

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-primary/20 pb-6">
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

        {/* Tabs */}
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

        {loading && <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

        {!loading && activeTab === 'favorites' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-on-surface">Liked Photos ({bookmarks.length})</h2>
            {bookmarks.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant bg-black/20 rounded-xl border border-white/5">
                No favorites yet. Like photos to see them here.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {bookmarks.map((bmk, idx) => (
                  <div 
                    key={bmk.id} 
                    className="relative group rounded-xl overflow-hidden bg-black aspect-square cursor-pointer"
                    onClick={() => openLightbox(bookmarks, idx)}
                  >
                    <img 
                      src={getImageUrl(bmk.filepath)} 
                      alt={bmk.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="h-5 w-5 fill-primary text-primary" />
                    </div>
                  </div>
                ))}
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {taggedPhotos.map((photo, idx) => (
                <div 
                  key={photo.photo_id} 
                  className="relative group rounded-xl overflow-hidden bg-black aspect-square cursor-pointer"
                  onClick={() => openLightbox(taggedPhotos, idx)}
                >
                  <img 
                    src={getImageUrl(photo.filepath)} 
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
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
