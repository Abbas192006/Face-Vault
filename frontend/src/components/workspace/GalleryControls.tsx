import { Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useUIStore, type GalleryFilter } from '@/stores/ui-store'
import { useSearchStore } from '@/stores/search-store'
import { FilterSortMenu } from '@/components/shared/FilterSortMenu'

const filters: { id: GalleryFilter; label: string }[] = [
  { id: 'all', label: 'All Captures' },
  { id: 'portraits', label: 'Portraits' },
  { id: 'groups', label: 'Group Shots' },
]

export function GalleryControls() {
  const { galleryFilter, galleryView, setGalleryFilter, setGalleryView } = useUIStore()
  const { matches, selectedPaths, setSelections, clearSelection, startDate, endDate, sortBy, setStartDate, setEndDate, setSortBy } = useSearchStore()

  const handleSelectAll = () => {
    if (selectedPaths.size === matches.length && matches.length > 0) {
      clearSelection()
    } else {
      setSelections(matches.map(m => m.photo.filepath))
    }
  }

  return (
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between w-full gap-4">
        <div className="flex items-center gap-4 text-on-surface-variant font-label-md flex-wrap">
          {filters.map((filter, i) => (
            <span key={filter.id} className="flex items-center gap-4">
              {i > 0 && <span className="opacity-30">|</span>}
              <button
                type="button"
                onClick={() => setGalleryFilter(filter.id)}
                className={cn(
                  'transition-colors',
                  galleryFilter === filter.id
                    ? 'text-on-surface font-bold'
                    : 'hover:text-primary',
                )}
              >
                {filter.label}
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <FilterSortMenu
            startDate={startDate}
            endDate={endDate}
            sortBy={sortBy}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSortChange={setSortBy}
          />

          <div className="flex items-center gap-2 border-l border-primary/20 pl-4">
            {matches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs mr-2"
              >
                {selectedPaths.size === matches.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGalleryView('grid')}
              className={galleryView === 'grid' ? 'text-primary' : ''}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGalleryView('list')}
              className={galleryView === 'list' ? 'text-primary' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
  )
}
