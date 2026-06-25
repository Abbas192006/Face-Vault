import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FolderPlus, Image as ImageIcon, Loader2, Play, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FolderPickerModal } from '@/components/shared/FolderPickerModal'
import { Link, useSearchParams } from 'react-router-dom'
import {
  fetchEvents,
  createEvent,
  deleteEvent,
  indexEvent,
  pollIndexStatus,
  type EventData
} from '@/lib/api'

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', folderPath: '', description: '' })
  const [indexingEvents, setIndexingEvents] = useState<Record<number, boolean>>({})

  const [searchParams, setSearchParams] = useSearchParams()

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await fetchEvents()
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsDialogOpen(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleCreate = async () => {
    if (!newEvent.name) {
      toast.error('Event name is required')
      return
    }
    try {
      await createEvent(newEvent.name, newEvent.folderPath, newEvent.description)
      toast.success('Event created successfully')
      setIsDialogOpen(false)
      setNewEvent({ name: '', folderPath: '', description: '' })
      loadEvents()
    } catch {
      toast.error('Failed to create event')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event? This will not delete the photos from disk, but will remove the event record.')) {
      return
    }
    try {
      await deleteEvent(id)
      toast.success('Event deleted')
      loadEvents()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const handleIndex = async (id: number) => {
    try {
      setIndexingEvents(prev => ({ ...prev, [id]: true }))
      const { task_id } = await indexEvent(id)
      toast.success('Indexing started...')
      
      const interval = setInterval(async () => {
        try {
          const status = await pollIndexStatus(task_id)
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval)
            setIndexingEvents(prev => ({ ...prev, [id]: false }))
            toast.success('Indexing complete!')
            loadEvents()
          }
        } catch {
          clearInterval(interval)
          setIndexingEvents(prev => ({ ...prev, [id]: false }))
        }
      }, 2000)
    } catch (err: any) {
      setIndexingEvents(prev => ({ ...prev, [id]: false }))
      toast.error(err.message || 'Failed to start indexing')
    }
  }

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Event Manager
          </h1>
          <p className="text-on-surface-variant font-body-md mt-2">
            Organize and index your photography events.
          </p>
        </div>

        <div>
          <Button 
            className="shadow-[0_0_20px_rgba(0,245,212,0.3)]"
            onClick={() => setIsDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>

          {isDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)}>
              <div className="glass-card border border-primary/20 p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-headline-md text-on-surface mb-4">Create New Event</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">Event Name</label>
                    <Input
                      placeholder="e.g. Wedding 2026"
                      value={newEvent.name}
                      onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">Folder Path</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select a folder..."
                        value={newEvent.folderPath}
                        readOnly
                        className="cursor-pointer"
                        onClick={() => setIsFolderPickerOpen(true)}
                      />
                      <Button variant="outline" onClick={() => setIsFolderPickerOpen(true)}>
                        Browse
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">Description (Optional)</label>
                    <Input
                      placeholder="Brief description"
                      value={newEvent.description}
                      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} className="flex-1">Create Event</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isFolderPickerOpen && (
          <FolderPickerModal 
            onSelect={(path) => {
              setNewEvent({ ...newEvent, folderPath: path })
              setIsFolderPickerOpen(false)
            }}
            onCancel={() => setIsFolderPickerOpen(false)}
          />
        )}
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <Calendar className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-on-surface-variant">
            No events found. Create your first event to start organizing your photos.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map(event => {
            const isIndexing = indexingEvents[event.id] || event.status === 'indexing' || event.status === 're-indexing'
            return (
              <motion.div
                key={event.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="glass-card rounded-xl p-6 border border-primary/10 relative overflow-hidden flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{event.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-[200px] truncate" title={event.folder_path}>
                      {event.folder_path || 'No folder set'}
                    </p>
                  </div>
                  <Badge variant="outline" className={
                    isIndexing ? 'bg-primary/20 text-primary border-primary/30 animate-pulse' :
                    event.status === 'indexed' ? 'bg-success/10 text-success border-success/20' :
                    'bg-warning/10 text-warning border-warning/20'
                  }>
                    {isIndexing ? 'Indexing...' : event.status}
                  </Badge>
                </div>

                <p className="text-sm text-on-surface-variant mb-6 flex-1">{event.description}</p>

                <div className="flex gap-4 mb-6 text-sm text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4" />
                    <span>{event.photo_count} photos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{event.face_count} faces</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={isIndexing || !event.folder_path}
                    onClick={() => handleIndex(event.id)}
                  >
                    {isIndexing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    {event.status === 'indexed' ? 'Re-index' : 'Index'}
                  </Button>
                  <Link to={`/events/${event.id}/people`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full" disabled={event.status !== 'indexed'}>
                      <Users className="h-4 w-4 mr-2" />
                      People
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 hover:bg-error/20 hover:text-error hover:border-error/30"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
