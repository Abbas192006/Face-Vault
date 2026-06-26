import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import { useSearchStore } from '@/stores/search-store'
import { FilterSortMenu } from '@/components/shared/FilterSortMenu'
import { groupPhotosByMonth } from '@/lib/grouping'

export default function RecentPage() {
  const { recentMatches, startDate, endDate, sortBy, setStartDate, setEndDate, setSortBy } = useSearchStore()

  const filteredAndSortedMatches = useMemo(() => {
    let result = [...recentMatches]

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
  }, [recentMatches, startDate, endDate, sortBy])

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-8">
      <header>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Recent Images
            </h1>
            <p className="text-on-surface-variant font-body-md mt-2">
              Photos from your most recent search session.
            </p>
          </div>

          {recentMatches.length > 0 && (
            <div className="flex items-center gap-3 bg-surface/30 p-2 border-b border-primary/10">
              <FilterSortMenu
                startDate={startDate}
                endDate={endDate}
                sortBy={sortBy}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onSortChange={setSortBy}
              />
            </div>
          )}
        </div>
      </header>

      {recentMatches.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <ImageIcon className="h-12 w-12 text-on-surface-variant mx-auto mb-4" />
          <p className="text-on-surface-variant">
            No recent images yet. Run a search from the Dashboard to populate this gallery.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortBy !== 'relevance' ? (
            groupPhotosByMonth(filteredAndSortedMatches, m => m.photo.captured_at).map(group => (
              <motion.div
                key={group.groupName}
                className="flex flex-col gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                <h3 className="text-xl font-medium text-on-surface flex items-center gap-2 px-2 border-b border-border/50 pb-2">
                  {group.groupName}
                  <span className="text-sm text-on-surface-variant font-normal bg-surface px-2 py-0.5 rounded-full">
                    {group.items.length} photos
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
                  {group.items.map((match) => {
                    const globalIdx = filteredAndSortedMatches.indexOf(match)
                    return (
                      <motion.div
                        key={`${match.photo.filepath}-${globalIdx}`}
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
                    )
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter"
            >
              {filteredAndSortedMatches.map((match, idx) => (
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
      )}
    </div>
  )
}
