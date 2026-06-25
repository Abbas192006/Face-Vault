import { motion } from 'framer-motion'
import { ImageIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import { useSearchStore } from '@/stores/search-store'

export default function RecentPage() {
  const { recentMatches } = useSearchStore()

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-8">
      <header>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          Recent Images
        </h1>
        <p className="text-on-surface-variant font-body-md mt-2">
          Photos from your most recent search session.
        </p>
      </header>

      {recentMatches.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <ImageIcon className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-on-surface-variant">
            No recent images yet. Run a search from the Dashboard to populate this gallery.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.04 } },
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter"
        >
          {recentMatches.map((match, idx) => (
            <motion.div
              key={`${match.photo.filepath}-${idx}`}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-xl overflow-hidden glass-card h-[280px] image-card"
            >
              <img
                className="w-full h-full object-cover"
                src={getImageUrl(match.photo.filepath)}
                alt={match.photo.filename}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-xs text-white truncate">{match.photo.filename}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
