// View-model for leaderboard presentation components.
import type { ProcessedEntry } from '@/shared/types'
import { useMemo } from 'react'
import { getLeaderboardEntryMeta } from './useLeaderboardEntry'

interface UseLeaderboardViewOptions {
  entries: ProcessedEntry[]
  isRegistered: (entry: ProcessedEntry) => boolean
  pacePercentThreshold: number
}

export interface LeaderboardViewEntry {
  entry: ProcessedEntry
  position: number
  isRegistered: boolean
  percentage: number | null
  deltaText: string
  badgeClass: string
  tooltipText: string
}

/**
 * Computes the best valid lap from rendered entries.
 * @param entries Leaderboard entries currently shown.
 * @returns Fastest lap in milliseconds or null.
 */
function getBestOverallLap(entries: ProcessedEntry[]): number | null {
  return entries.reduce((min, entry) => {
    if (entry.bestLap === null) {
      return min
    }
    if (min === null) {
      return entry.bestLap
    }
    return entry.bestLap < min ? entry.bestLap : min
  }, null as number | null)
}

/**
 * Builds presentational leaderboard rows/cards data for UI components.
 * @param options Input options.
 * @returns Precomputed list of entry view models.
 */
export function useLeaderboardView(options: UseLeaderboardViewOptions): LeaderboardViewEntry[] {
  const { entries, isRegistered, pacePercentThreshold } = options

  return useMemo(() => {
    const bestOverallLap = getBestOverallLap(entries)
    return entries.map((entry, index) => {
      const meta = getLeaderboardEntryMeta(entry, bestOverallLap, pacePercentThreshold)
      return {
        entry,
        position: index + 1,
        isRegistered: isRegistered(entry),
        percentage: meta.percentage,
        deltaText: meta.deltaText,
        badgeClass: meta.badgeClass,
        tooltipText: meta.tooltipText,
      }
    })
  }, [entries, isRegistered, pacePercentThreshold])
}
