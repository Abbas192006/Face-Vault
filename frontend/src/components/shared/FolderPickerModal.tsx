import { useEffect, useState } from 'react'
import { Folder, ChevronRight, CornerUpLeft, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchDirectories, type DirectoryResponse } from '@/lib/api'

interface FolderPickerModalProps {
  onSelect: (path: string) => void
  onCancel: () => void
  initialPath?: string
}

export function FolderPickerModal({ onSelect, onCancel, initialPath = 'C:/' }: FolderPickerModalProps) {
  const [data, setData] = useState<DirectoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDir = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDirectories(path)
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDir(initialPath)
  }, [initialPath])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div 
        className="glass-card border border-primary/20 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden bg-background" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-primary/5">
          <h2 className="text-lg font-headline-md text-on-surface">Select Folder</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 bg-surface-variant/30 border-b border-primary/10">
          <div className="text-sm font-mono text-on-surface-variant truncate">
            {data?.current || 'Loading...'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-error">
              <p>{error}</p>
              {data?.parent && (
                <Button variant="outline" className="mt-4" onClick={() => loadDir(data.parent!)}>
                  Go Back
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {data?.parent && (
                <div 
                  className="flex items-center p-2 hover:bg-primary/10 rounded cursor-pointer text-on-surface transition-colors"
                  onClick={() => loadDir(data.parent!)}
                >
                  <CornerUpLeft className="h-4 w-4 mr-3 text-on-surface-variant" />
                  <span>..</span>
                </div>
              )}
              {data?.directories.map(dir => (
                <div 
                  key={dir.path}
                  className="flex items-center justify-between p-2 hover:bg-primary/10 rounded cursor-pointer text-on-surface transition-colors group"
                  onClick={() => loadDir(dir.path)}
                >
                  <div className="flex items-center overflow-hidden">
                    <Folder className="h-4 w-4 mr-3 text-primary shrink-0" />
                    <span className="truncate">{dir.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {data?.directories.length === 0 && (
                <div className="text-center p-8 text-on-surface-variant text-sm">
                  This folder is empty.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-primary/20 flex justify-end gap-3 bg-surface">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            disabled={!data?.current} 
            onClick={() => data?.current && onSelect(data.current)}
          >
            Select Current Folder
          </Button>
        </div>
      </div>
    </div>
  )
}
