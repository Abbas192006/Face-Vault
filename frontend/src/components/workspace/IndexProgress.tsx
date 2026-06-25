import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Progress } from '@/components/ui/progress'
import { useSearchStore } from '@/stores/search-store'

export function IndexProgress() {
  const { isScanning, progress } = useSearchStore()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (progress.status === 'completed' && barRef.current) {
      gsap.fromTo(barRef.current, { scaleX: 1 }, { scaleX: 1.02, duration: 0.2, yoyo: true, repeat: 1 })
    }
  }, [progress.status])

  if (!isScanning || progress.total <= 0) return null

  const percent = (progress.processed / progress.total) * 100

  return (
    <div ref={barRef} className="w-full glass-card p-4 rounded-xl">
      <div className="flex justify-between text-xs mb-2 font-bold tracking-widest uppercase text-on-surface-variant">
        <span className="text-primary">{progress.status}</span>
        <span>
          {progress.processed} / {progress.total}
        </span>
      </div>
      <Progress value={percent} />
    </div>
  )
}
