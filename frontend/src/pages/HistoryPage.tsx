import { useEffect, useMemo, useState } from 'react'
import { Download, Folder, MoreVertical, RefreshCw, Search, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { fetchHistory, deleteHistoryEntry, clearAllHistory, type HistoryEntry } from '@/lib/api'
import { FilterSortMenu } from '@/components/shared/FilterSortMenu'

// Added id to HistoryEntry type inline here if missing from api
interface ExtendedHistoryEntry extends HistoryEntry {
  id?: number
}

function exportHistoryCsv(history: ExtendedHistoryEntry[]) {
  const header = 'Date,Time,Directory,Matches\n'
  const rows = history
    .map((item) => {
      const d = new Date(item.searched_at)
      return `"${d.toLocaleDateString()}","${d.toLocaleTimeString()}","${item.folder_scanned || 'Global Search'}",${item.match_count}`
    })
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'facevault_history.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ExtendedHistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await fetchHistory()
      setHistory(data)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleDeleteEntry = async (id: number | undefined) => {
    if (!id) return
    try {
      await deleteHistoryEntry(id)
      setHistory(prev => prev.filter(item => item.id !== id))
      toast.success('History entry deleted')
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all search history?')) {
      return
    }
    try {
      await clearAllHistory()
      setHistory([])
      toast.success('Search history cleared')
    } catch {
      toast.error('Failed to clear history')
    }
  }

  const filtered = useMemo(() => {
    let result = [...history]

    if (startDate || endDate) {
      result = result.filter((item) => {
        const cap = item.searched_at
        if (!cap) return false
        const capString = cap.split('T')[0]
        if (startDate && capString < startDate) return false
        if (endDate && capString > endDate) return false
        return true
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.folder_scanned?.toLowerCase().includes(q) ||
          item.match_count.toString().includes(q),
      )
    }

    return result
  }, [history, searchQuery, startDate, endDate])

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-8">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Search History</h2>
            <p className="text-on-surface-variant mt-1">
              Review your past Ensemble Recognition queries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-error hover:bg-error/20 hover:text-error border-error/20"
              onClick={handleClearAll}
              disabled={history.length === 0}
            >
              <AlertTriangle className="h-4 w-4" />
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportHistoryCsv(filtered)
                toast.success('History exported')
              }}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            className="pl-12 bg-background border-primary/20"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterSortMenu
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          showSort={false}
        />
      </div>

      <div className="glass-card rounded-xl border border-primary/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface/50 hover:bg-surface/50">
              <TableHead>Date & Time</TableHead>
              <TableHead>Directory</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item, i) => (
              <TableRow key={`${item.id || item.searched_at}-${i}`} className="group">
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container border border-primary/20 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <div className="text-on-surface font-medium">
                        {new Date(item.searched_at).toLocaleDateString()}
                      </div>
                      <div className="text-on-surface-variant text-xs">
                        {new Date(item.searched_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-on-surface">
                  {item.folder_scanned || 'Global Search'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{item.match_count} Items</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-error"
                        onClick={() => handleDeleteEntry(item.id)}
                        disabled={!item.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="p-10 text-center text-on-surface-variant">
                  {loading ? 'Loading history...' : 'No history found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
