import { Card } from '@/components/ui/card';
import { CarClassBadge } from './CarClassBadge';
import { formatTime } from '@/lib/utils';
import { cardPadding, sectorBadge } from '@/lib/styles';
import { useLeaderboardEntry } from '@/hooks/useLeaderboardEntry';
import type { ProcessedEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface LeaderboardCardProps {
    entry: ProcessedEntry;
    position: number;
    bestOverallLap: number | null;
}

export function LeaderboardCard({ entry, position, bestOverallLap }: LeaderboardCardProps) {
    const { percentage, badgeClass, hasSplits } = useLeaderboardEntry(entry, bestOverallLap);

    return (
        <Card className={cardPadding.card}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-primary shrink-0">#{position}</span>
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                            {entry.driverName}
                        </h3>
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
                        {percentage && percentage >= 100 && (
                            <Badge variant="outline" className={`h-5 px-1.5 font-mono text-[10px] ${badgeClass}`}>
                                {Math.floor(percentage)}%
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
            {hasSplits && (
                <div className="mt-2 pt-2 border-t">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                        Sectors
                    </div>

                    <div className="space-y-1.5">
                        {entry.bestLapSplits.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground min-w-[60px]">
                                    Best:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {entry.bestLapSplits.map((split, i) => (
                                        <span
                                            key={`best-${i}`}
                                            className={sectorBadge.best}
                                        >
                                            {formatTime(split)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {entry.splits.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground min-w-[60px]">
                                    Theor:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {entry.splits.map((split, i) => (
                                        <span
                                            key={`theor-${i}`}
                                            className={sectorBadge.theoretical}
                                        >
                                            {formatTime(split)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
