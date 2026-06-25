import { Suspense, lazy, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Users, Search, Database } from 'lucide-react'
import { GalleryControls } from '@/components/workspace/GalleryControls'
import { IndexProgress } from '@/components/workspace/IndexProgress'
import { MatchGallery } from '@/components/workspace/MatchGallery'
import { SearchToolbar, TargetFolderInput } from '@/components/workspace/SearchToolbar'
import { useSearchStore } from '@/stores/search-store'
import { useStatsStore } from '@/stores/stats-store'

const ScanEffect = lazy(() =>
  import('@/components/three/ScanEffect').then((m) => ({ default: m.ScanEffect })),
)

function ScanFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-primary font-label-md tracking-widest uppercase animate-pulse">
          Neural Scan Active
        </p>
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  const { searchError, showScanOverlay } = useSearchStore()
  const { stats, loadStats } = useStatsStore()

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-8">
      {stats && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total_photos}</p>
              <p className="text-on-surface-variant text-sm">Total Photos</p>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total_faces}</p>
              <p className="text-on-surface-variant text-sm">Faces Detected</p>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total_searches}</p>
              <p className="text-on-surface-variant text-sm">Total Searches</p>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="glass-card p-6 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.index_size_mb} MB</p>
              <p className="text-on-surface-variant text-sm">Index Size</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Recent Images
            </h1>
            <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-label-sm uppercase tracking-tighter">
                Live Feed
              </span>
            </div>
          </div>
          <p className="text-on-surface-variant font-body-md">
            Upload selfies to run Ensemble Recognition across the target directory.
          </p>
        </div>
        <div className="hidden sm:block w-full max-w-md">
          <TargetFolderInput />
        </div>
      </header>

      <SearchToolbar />
      <IndexProgress />

      {searchError && (
        <div className="p-4 bg-error-container/20 text-error border border-error/30 rounded-lg">
          {searchError}
        </div>
      )}

      <GalleryControls />
      <MatchGallery />

      {showScanOverlay && (
        <Suspense fallback={<ScanFallback />}>
          <ScanEffect />
        </Suspense>
      )}
    </div>
  )
}
