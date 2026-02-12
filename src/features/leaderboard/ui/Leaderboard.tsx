// @anchor: leaderboard/features/list-ui
// @intent: Renders leaderboard entries with mobile card and desktop row layouts.
import type { ProcessedEntry } from '@/lib/types'
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

  const bestOverallLap = getBestOverallLap(entries)

  return (
    <>
      {/* Mobile: Cards */}
      <div className="flex flex-col gap-2 sm:gap-2.5 md:hidden">
        {entries.map((entry, index) => (
          <LeaderboardCard
            key={entry.id}
            entry={entry}
            position={index + 1}
            bestOverallLap={bestOverallLap}
            pacePercentThreshold={pacePercentThreshold}
            isRegistered={isRegistered(entry)}
          />
        ))}
      </div>

      {/* Desktop: Compact Rows */}
      <div className="hidden md:flex md:flex-col md:gap-1.5">
        {entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            position={index + 1}
            bestOverallLap={bestOverallLap}
            pacePercentThreshold={pacePercentThreshold}
            isRegistered={isRegistered(entry)}
          />
        ))}
      </div>
    </>
  )
}
