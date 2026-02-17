// @anchor: leaderboard/pages/live-timing/ui/leaderboard-list
// @intent: Renders leaderboard entries with mobile card and desktop row layouts.
import type { ProcessedEntry } from '@/shared/types'
import { useMemo } from 'react'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { LeaderboardCard } from './LeaderboardCard'
import { LeaderboardRow } from './LeaderboardRow'

interface LeaderboardProps {
  entries: ProcessedEntry[]
  pacePercentThreshold: number
  isRegistered: (entry: ProcessedEntry) => boolean
}

/**
 * Computes the best valid lap from visible entries.
 * @param entries Leaderboard entries currently rendered.
 * @returns Fastest lap in milliseconds or null.
 */
function getBestOverallLap(entries: ProcessedEntry[]): number | null {
  return entries.reduce((min, entry) => {
    if (entry.bestLap === null)
      return min
    if (min === null)
      return entry.bestLap
    return entry.bestLap < min ? entry.bestLap : min
  }, null as number | null)
}

/**
 * Renders leaderboard entries in responsive layouts.
 * @param props Component props object.
 * @param props.entries Leaderboard entries to display.
 * @param props.pacePercentThreshold Pace threshold used for badges.
 * @param props.isRegistered Registration resolver for each entry.
 * @returns Responsive leaderboard list.
 */
export function Leaderboard(props: LeaderboardProps) {
  const { entries, pacePercentThreshold, isRegistered } = props

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const bestOverallLap = useMemo(() => getBestOverallLap(entries), [entries])
  const registrationByEntryId = useMemo(() => {
    return new Map(entries.map(entry => [entry.id, isRegistered(entry)]))
  }, [entries, isRegistered])

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-3">🏁</div>
          <p className="text-lg text-muted-foreground">No timing data available</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Waiting for drivers to set lap times...
          </p>
        </div>
      </div>
    )
  }

  const EntryComponent = isDesktop ? LeaderboardRow : LeaderboardCard
  const listClassName = isDesktop ? 'flex flex-col gap-1.5' : 'flex flex-col gap-2 sm:gap-2.5'

  return (
    <div className={listClassName}>
      {entries.map((entry, index) => (
        <EntryComponent
          key={entry.id}
          entry={entry}
          position={index + 1}
          bestOverallLap={bestOverallLap}
          pacePercentThreshold={pacePercentThreshold}
          isRegistered={registrationByEntryId.get(entry.id) ?? false}
        />
      ))}
    </div>
  )
}
