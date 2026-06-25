import { create } from 'zustand'
import { fetchStats, type StatsData } from '@/lib/api'

interface StatsState {
  stats: StatsData | null
  loading: boolean
  loadStats: () => Promise<void>
}

export const useStatsStore = create<StatsState>()((set) => ({
  stats: null,
  loading: false,
  loadStats: async () => {
    set({ loading: true })
    try {
      const stats = await fetchStats()
      set({ stats })
    } catch {
      // silently fail
    } finally {
      set({ loading: false })
    }
  },
}))
