import * as React from 'react'
import { CalendarIcon, SlidersHorizontal, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface FilterSortMenuProps {
  startDate: string | undefined
  endDate: string | undefined
  sortBy?: 'relevance' | 'newest' | 'oldest'
  onStartDateChange: (date: string | undefined) => void
  onEndDateChange: (date: string | undefined) => void
  onSortChange?: (sort: 'relevance' | 'newest' | 'oldest') => void
  showSort?: boolean
}

export function FilterSortMenu({
  startDate,
  endDate,
  sortBy = 'relevance',
  onStartDateChange,
  onEndDateChange,
  onSortChange,
  showSort = true
}: FilterSortMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn(
          "bg-surface/50 border-primary/20 hover:bg-primary/10 gap-2 transition-all shadow-sm backdrop-blur-md",
          (startDate || endDate || (showSort && sortBy !== 'relevance')) && "border-primary/50 text-primary"
        )}>
          <SlidersHorizontal className="w-4 h-4" />
          Filter {showSort && "& Sort"}
          {(startDate || endDate || (showSort && sortBy !== 'relevance')) && (
            <span className="flex h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-surface/95 backdrop-blur-xl border-primary/20 shadow-2xl rounded-2xl overflow-hidden" align="end">
        <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
          <h4 className="font-headline-sm text-on-surface">Display Options</h4>
          {(startDate || endDate || (showSort && sortBy !== 'relevance')) && (
            <button
              onClick={() => {
                onStartDateChange(undefined)
                onEndDateChange(undefined)
                if (onSortChange) onSortChange('relevance')
              }}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Reset All
            </button>
          )}
        </div>
        
        <div className="p-4 space-y-4">
          {/* Date Range Section */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Date Range</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant px-1 font-medium">From</label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/60 pointer-events-none group-focus-within:text-primary transition-colors" />
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => onStartDateChange(e.target.value || undefined)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker()
                      } catch {}
                    }}
                    className="w-full bg-black/20 border border-primary/10 rounded-lg py-2 pl-8 pr-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:bg-black/30"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-on-surface-variant px-1 font-medium">To</label>
                <div className="relative group">
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/60 pointer-events-none group-focus-within:text-primary transition-colors" />
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => onEndDateChange(e.target.value || undefined)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker()
                      } catch {}
                    }}
                    className="w-full bg-black/20 border border-primary/10 rounded-lg py-2 pl-8 pr-2 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:bg-black/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sort Section */}
          {showSort && onSortChange && (
            <div className="space-y-2 pt-4 border-t border-primary/10">
              <h5 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Sort By</h5>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'relevance', label: 'Best Match' },
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value as any)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                      sortBy === option.value 
                        ? "bg-primary/20 text-primary font-medium" 
                        : "hover:bg-primary/10 text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    {option.label}
                    {sortBy === option.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
