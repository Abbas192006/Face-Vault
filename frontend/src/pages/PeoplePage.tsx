import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Users, Edit2, Check, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatePresence, motion } from 'framer-motion'
import { PhotoLightbox } from '@/components/shared/PhotoLightbox'
import { FilterSortMenu } from '@/components/shared/FilterSortMenu'
import { groupPhotosByMonth } from '@/lib/grouping'
import { fetchEventPeople, renamePerson, fetchPersonFaces, getImageUrl, downloadZip, type PersonData, type PersonFaceData } from '@/lib/api'

export default function PeoplePage() {
  const { eventId } = useParams()
  const [people, setPeople] = useState<PersonData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null)

  useEffect(() => {
    loadPeople()
  }, [eventId])

  const loadPeople = async () => {
    if (!eventId) return
    try {
      setLoading(true)
      const data = await fetchEventPeople(parseInt(eventId))
      setPeople(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async (personId: number) => {
    if (!editName.trim()) return
    try {
      await renamePerson(personId, editName)
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, name: editName } : p))
      setEditingId(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center mb-6 gap-4 shrink-0">
        <Link to="/events">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-headline-lg font-bold text-on-surface flex items-center">
          <Users className="h-8 w-8 mr-3 text-primary" />
          Clustered People
        </h1>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar: People List */}
        <div className="w-80 flex flex-col glass-card border border-primary/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
          <div className="p-4 bg-primary/5 border-b border-primary/10">
            <h2 className="font-headline-md text-on-surface">People ({people.length})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : people.length === 0 ? (
              <div className="text-center p-8 text-on-surface-variant text-sm">
                No people clustered yet. Try re-indexing the event.
              </div>
            ) : (
              people.map(person => (
                <div 
                  key={person.id}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    selectedPerson?.id === person.id ? 'bg-primary/20 border-primary/30 border' : 'hover:bg-primary/5 border border-transparent'
                  }`}
                  onClick={() => setSelectedPerson(person)}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-variant border border-primary/20">
                    {person.rep_filepath ? (
                      <img 
                        src={getImageUrl(person.rep_filepath)} 
                        className="w-full h-full object-cover" 
                        alt={person.name} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-on-surface-variant" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === person.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(person.id)}
                          className="h-7 text-sm px-2"
                          onClick={e => e.stopPropagation()}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-400" onClick={(e) => { e.stopPropagation(); handleRename(person.id) }}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setEditingId(null) }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="truncate font-medium text-on-surface text-sm">
                          {person.name}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(person.id)
                            setEditName(person.name)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="text-xs text-on-surface-variant">
                      {person.face_count} photo{person.face_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Area: Person Faces */}
        <div className="flex-1 glass-card border border-primary/20 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {selectedPerson ? (
            <PersonFaces 
              person={selectedPerson} 
              onRename={() => {
                setEditingId(selectedPerson.id)
                setEditName(selectedPerson.name)
              }} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50">
              <Users className="h-20 w-20 mb-4" />
              <p className="text-lg">Select a person to view their photos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PersonFaces({ person, onRename }: { person: PersonData, onRename: () => void }) {
  const [faces, setFaces] = useState<PersonFaceData[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest'>('relevance')

  const filteredFaces = useMemo(() => {
    let result = [...faces]
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
  }, [faces, startDate, endDate, sortBy])

  useEffect(() => {
    loadFaces()
  }, [person.id])

  const loadFaces = async () => {
    setLoading(true)
    try {
      const data = await fetchPersonFaces(person.id)
      setFaces(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (faces.length === 0) return
    setDownloading(true)
    try {
      const paths = faces.map(f => f.filepath)
      const blob = await downloadZip(paths)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${person.name.replace(/\s+/g, '_')}_Photos.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Download failed", e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-headline-md text-on-surface text-xl">{person.name}</h2>
          <Button variant="ghost" size="sm" onClick={onRename} className="h-8 text-on-surface-variant">
            <Edit2 className="h-3 w-3 mr-2" />
            Rename
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-on-surface-variant bg-surface-variant/50 px-3 py-1 rounded-full">
            {faces.length} Photos Found
          </div>
          <Button variant="default" size="sm" onClick={handleDownload} disabled={downloading || faces.length === 0}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Zip
          </Button>
        </div>
      </div>

      <div className="bg-surface/30 p-3 border-b border-primary/10 flex items-center">
        <FilterSortMenu
          startDate={startDate}
          endDate={endDate}
          sortBy={sortBy}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSortChange={setSortBy}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {sortBy !== 'relevance' ? (
              groupPhotosByMonth(filteredFaces, m => m.captured_at || undefined).map(group => (
                <motion.div key={group.groupName} className="flex flex-col gap-4">
                  <h3 className="text-xl font-medium text-on-surface flex items-center gap-2 px-2 border-b border-border/50 pb-2">
                    {group.groupName}
                    <span className="text-sm text-on-surface-variant font-normal bg-surface px-2 py-0.5 rounded-full">
                      {group.items.length} photos
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {group.items.map(face => {
                      const idx = filteredFaces.indexOf(face)
                      return (
                        <div 
                          key={face.face_id} 
                          className="relative group rounded-xl overflow-hidden bg-black aspect-square cursor-pointer"
                          onClick={() => setLightboxIndex(idx)}
                        >
                          <img 
                            src={getImageUrl(face.filepath)} 
                            alt={face.filename}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 left-3 right-3 text-xs text-white truncate font-mono">
                              {face.filename}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFaces.map((face, idx) => (
                  <div 
                    key={face.face_id} 
                    className="relative group rounded-xl overflow-hidden bg-black aspect-square cursor-pointer"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img 
                      src={getImageUrl(face.filepath)} 
                      alt={face.filename}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3 text-xs text-white truncate font-mono">
                        {face.filename}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox 
            photos={filteredFaces}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
