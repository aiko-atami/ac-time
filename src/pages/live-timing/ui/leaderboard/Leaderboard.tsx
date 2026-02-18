// @anchor: leaderboard/pages/live-timing/ui/leaderboard-list
// @intent: Renders leaderboard entries with mobile card and desktop row layouts.
import type { ProcessedEntry } from '@/shared/types'
import { useMediaQuery } from '@/shared/lib/useMediaQuery'
import { useLeaderboardView } from '../../model/leaderboard/useLeaderboardView'
import { LeaderboardCard } from './LeaderboardCard'
import { LeaderboardRow } from './LeaderboardRow'

interface LeaderboardProps {
  entries: ProcessedEntry[]
  pacePercentThreshold: number
  isRegistered: (entry: ProcessedEntry) => boolean
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
  const viewEntries = useLeaderboardView({
    entries,
    isRegistered,
    pacePercentThreshold,
  })

  if (viewEntries.length === 0) {
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
      {viewEntries.map(viewEntry => (
        <EntryComponent
          key={viewEntry.entry.id}
          entry={viewEntry.entry}
          position={viewEntry.position}
          percentage={viewEntry.percentage}
          deltaText={viewEntry.deltaText}
          badgeClass={viewEntry.badgeClass}
          tooltipText={viewEntry.tooltipText}
          isRegistered={viewEntry.isRegistered}
        />
      ))}
    </div>
  )
}
