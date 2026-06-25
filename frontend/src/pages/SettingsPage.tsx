import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { API_BASE } from '@/lib/constants'
import { useSearchStore } from '@/stores/search-store'
import { useUIStore } from '@/stores/ui-store'
import { useStatsStore } from '@/stores/stats-store'
import { nukeAllData } from '@/lib/api'

export default function SettingsPage() {
  const { defaultStrictness, setDefaultStrictness } = useUIStore()
  const { setStrictness } = useSearchStore()
  const { stats, loadStats } = useStatsStore()
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api')

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleNukeData = async () => {
    if (!window.confirm('DANGER: This will permanently delete ALL photos, events, tags, and history from the database, and reset the FAISS index. Are you absolutely sure?')) {
      return
    }
    try {
      await nukeAllData()
      toast.success('All data has been successfully deleted.')
      loadStats()
    } catch {
      toast.error('Failed to reset data.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1>
        <p className="text-on-surface-variant font-body-md mt-2">
          Configure your FaceVault workspace preferences.
        </p>
      </header>

      <div className="glass-card rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-headline-md text-headline-md mb-2">Search Defaults</h3>
          <p className="text-on-surface-variant text-sm mb-4">
            Default strictness threshold for face matching (lower = more results).
          </p>
          <div className="flex items-center gap-4">
            <Slider
              min={0.2}
              max={1.5}
              step={0.1}
              value={[defaultStrictness]}
              onValueChange={([v]) => {
                const val = v ?? 0.6
                setDefaultStrictness(val)
                setStrictness(val)
              }}
              className="flex-1"
            />
            <span className="text-primary font-mono w-8">{defaultStrictness.toFixed(1)}</span>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-headline-md text-headline-md mb-2">API Connection</h3>
          <p className="text-on-surface-variant text-sm mb-4">
            Backend API URL. Requires app restart after changing.
          </p>
          <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
          <p className="text-xs text-on-surface-variant mt-2">
            Current active: {API_BASE}
          </p>
        </div>

        <Separator />

        <div>
          <h3 className="font-headline-md text-headline-md mb-2 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Database Info
          </h3>
          <p className="text-on-surface-variant text-sm mb-4">
            Current statistics for your local SQLite database and FAISS vector index.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface/50 border border-primary/20 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Photos Indexed</p>
              <p className="text-xl font-mono text-on-surface">{stats?.total_photos ?? '...'}</p>
            </div>
            <div className="p-4 bg-surface/50 border border-primary/20 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Faces Detected</p>
              <p className="text-xl font-mono text-on-surface">{stats?.total_faces ?? '...'}</p>
            </div>
            <div className="p-4 bg-surface/50 border border-primary/20 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">SQLite DB Size</p>
              <p className="text-xl font-mono text-on-surface">{stats?.db_size_mb ?? '...'} MB</p>
            </div>
            <div className="p-4 bg-surface/50 border border-primary/20 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">FAISS Index Size</p>
              <p className="text-xl font-mono text-on-surface">{stats?.index_size_mb ?? '...'} MB</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-headline-md text-headline-md mb-2">Appearance</h3>
          <p className="text-on-surface-variant text-sm mb-4">
            FaceVault uses a cinematic dark theme optimized for photo review.
          </p>
          <Button variant="outline" disabled>
            Dark Mode (Active)
          </Button>
        </div>

        <Separator />

        <div className="border border-error/30 rounded-xl p-4 bg-error/5">
          <h3 className="font-headline-md text-headline-md mb-2 text-error flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="text-error/80 text-sm mb-4">
            Permanently delete all indexed photos, events, tags, and search history. This cannot be undone.
          </p>
          <Button variant="destructive" onClick={handleNukeData}>
            Delete All Data
          </Button>
        </div>

        <Button
          onClick={() => toast.success('Settings saved locally')}
          className="w-full sm:w-auto mt-4"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
