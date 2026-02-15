// @anchor: leaderboard/pages/live-timing/ui/leaderboard-card
// @intent: Compact mobile card representation of a leaderboard entry.
import type { ProcessedEntry } from '@/shared/types'
import { useMemo } from 'react'
import { formatTime } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { getLeaderboardEntryMeta } from '../../model/leaderboard/useLeaderboardEntry'
import { CarClassBadge } from './CarClassBadge'
import { cardPadding, fontSize, sectorBadge, timeMeta } from './styles'

interface LeaderboardCardProps {
  entry: ProcessedEntry
  position: number
  bestOverallLap: number | null
  pacePercentThreshold: number
  isRegistered?: boolean
}

/**
 * Creates stable keys for split lists without relying on array index.
 * @param splits Split values in milliseconds.
 * @param prefix Key prefix for list context.
 * @returns Keyed split values for rendering.
 */
function toKeyedSplits(splits: Array<number | null>, prefix: 'best' | 'theor'): Array<{ key: string, value: number }> {
  const occurrences = new Map<number, number>()
  return splits
    .filter((split): split is number => split !== null)
    .map((split) => {
      const count = (occurrences.get(split) ?? 0) + 1
      occurrences.set(split, count)
      return {
        key: `${prefix}-${split}-${count}`,
        value: split,
      }
    })
}

/**
 * Renders one leaderboard entry as a mobile-first card.
 * @param props Component props object.
 * @param props.entry Entry data to render.
 * @param props.position Current visual position.
 * @param props.bestOverallLap Best lap used for pace comparison.
 * @param props.pacePercentThreshold Pace threshold used for badge classes.
 * @param props.isRegistered Whether driver is registered in participants list.
 * @returns Leaderboard entry card.
 */
export function LeaderboardCard(props: LeaderboardCardProps) {
  const { entry, position, bestOverallLap, pacePercentThreshold, isRegistered } = props
  const { percentage, deltaText, badgeClass } = getLeaderboardEntryMeta(entry, bestOverallLap, pacePercentThreshold)
  const bestLapSplits = useMemo(() => toKeyedSplits(entry.bestLapSplits, 'best'), [entry.bestLapSplits])
  const theoreticalSplits = useMemo(() => toKeyedSplits(entry.splits, 'theor'), [entry.splits])
  const hasRenderableSplits = bestLapSplits.length > 0 || theoreticalSplits.length > 0

  return (
    <Card className={cardPadding.card}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-primary shrink-0">
              #
              {position}
            </span>
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {entry.driverName}
            </h3>
            {!isRegistered && (
              <span className="text-destructive font-bold text-lg leading-none">•</span>
            )}
          </div>
          {entry.teamName && (
            <p className="text-xs text-muted-foreground truncate">
              {entry.teamName}
            </p>
          )}
        </div>

        <CarClassBadge carClass={entry.carClass} />
      </div>

      {/* Car Name + Laps */}
      <div className="mb-2 pb-1.5 border-b flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground truncate">
          {entry.carName}
        </p>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="text-xs text-muted-foreground font-medium">Laps:</span>
          <span className="text-sm font-semibold">{entry.lapCount}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Best:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-mono text-primary">
              {formatTime(entry.bestLap)}
            </span>
            <span className={`${fontSize.delta} ${timeMeta.delta}`}>
              {deltaText}
            </span>
            {percentage && percentage >= 100 && (
              <Badge variant="outline" className={`h-5 px-1.5 font-mono text-[10px] ${badgeClass}`}>
                {Math.floor(percentage)}
                %
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Theor:</span>
          <span className="text-sm font-semibold font-mono text-muted-foreground">
            {formatTime(entry.theoreticalBestLap)}
          </span>
        </div>
      </div>

      {/* Splits Section */}
      {hasRenderableSplits && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Sectors
          </div>

          <div className="flex flex-col gap-1.5">
            {bestLapSplits.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  Best:
                </span>
                <div className="flex flex-wrap gap-1">
                  {bestLapSplits.map(split => (
                    <span
                      key={split.key}
                      className={sectorBadge.best}
                    >
                      {formatTime(split.value)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {theoreticalSplits.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  Theor:
                </span>
                <div className="flex flex-wrap gap-1">
                  {theoreticalSplits.map(split => (
                    <span
                      key={split.key}
                      className={sectorBadge.theoretical}
                    >
                      {formatTime(split.value)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
