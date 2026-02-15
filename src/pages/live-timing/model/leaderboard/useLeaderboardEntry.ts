// @anchor: leaderboard/pages/live-timing/model/use-leaderboard-entry
// @intent: Derive presentational metadata for leaderboard rows and cards.
import type { ProcessedEntry } from '@/shared/types'
import { DEFAULT_PACE_PERCENT_THRESHOLD } from '@/shared/config/constants'
import { formatDeltaTime, formatTime } from '@/shared/lib/utils'

interface UseLeaderboardEntryResult {
  percentage: number | null
  deltaToLeaderMs: number | null
  deltaText: string
  badgeClass: string
  tooltipText: string
  hasSplits: boolean
}

export function getLeaderboardEntryMeta(
  entry: ProcessedEntry,
  bestOverallLap: number | null,
  pacePercentThreshold: number = DEFAULT_PACE_PERCENT_THRESHOLD,
): UseLeaderboardEntryResult {
  // Calculate percentage relative to best lap
  const percentage
    = entry.bestLap && bestOverallLap && bestOverallLap > 0
      ? (entry.bestLap / bestOverallLap) * 100
      : null

  // Calculate absolute gap to leader in milliseconds.
  const deltaToLeaderMs
    = entry.bestLap !== null && bestOverallLap !== null
      ? Math.max(0, entry.bestLap - bestOverallLap)
      : null
  const deltaText = formatDeltaTime(deltaToLeaderMs)

  // Determine badge styling based on percentage
  let badgeClass = 'bg-muted text-muted-foreground hover:bg-muted/80'
  const warningThreshold = Math.max(100, pacePercentThreshold - 2)
  if (percentage) {
    if (percentage > pacePercentThreshold) {
      badgeClass = 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
    }
    else if (percentage > warningThreshold && percentage <= pacePercentThreshold) {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 border-amber-500/20'
    }
  }

  // Check if splits data exists
  const hasSplits = entry.bestLapSplits.length > 0 || entry.splits.length > 0

  // Build tooltip text for sectors
  const buildTooltipText = (): string => {
    const lines: string[] = []

    if (entry.bestLapSplits.length > 0) {
      lines.push(`Best: ${entry.bestLapSplits.map(s => formatTime(s)).join(' | ')}`)
    }
    if (entry.splits.length > 0) {
      lines.push(`Theor: ${entry.splits.map(s => formatTime(s)).join(' | ')}`)
    }

    return lines.length > 0 ? lines.join('\n') : 'No sector data'
  }

  return {
    percentage,
    deltaToLeaderMs,
    deltaText,
    badgeClass,
    tooltipText: buildTooltipText(),
    hasSplits,
  }
}
