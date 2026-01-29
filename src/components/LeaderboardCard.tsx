import { Card } from '@/components/ui/card';
import { CarClassBadge } from './CarClassBadge';
import { formatTime } from '@/lib/utils';
import type { ProcessedEntry } from '@/lib/types';

interface LeaderboardCardProps {
    entry: ProcessedEntry;
    position: number;
}

export function LeaderboardCard({ entry, position }: LeaderboardCardProps) {
    const hasSplits = entry.bestLapSplits.length > 0 || entry.splits.length > 0;

    return (
        <Card className="p-3 sm:p-4">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 mb-3">
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                    #{position}
                </div>

                <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">
                        {entry.driverName}
                    </h3>
                    {entry.teamName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {entry.teamName}
                        </p>
                    )}
                </div>

                <CarClassBadge carClass={entry.carClass} />
            </div>

            {/* Car Name */}
            <div className="mb-3 pb-2 border-b">
                <p className="text-sm text-muted-foreground truncate">
                    {entry.carName}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Best
                    </span>
                    <span className="text-base sm:text-lg font-semibold font-mono">
                        {formatTime(entry.bestLap)}
                    </span>
                </div>

                <div className="flex flex-col gap-1 hidden sm:flex">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Theoretical
                    </span>
                    <span className="text-base sm:text-lg font-semibold font-mono text-amber-600 dark:text-amber-500">
                        {formatTime(entry.theoreticalBestLap)}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Laps
                    </span>
                    <span className="text-base sm:text-lg font-semibold">
                        {entry.lapCount}
                    </span>
                </div>
            </div>

            {/* Splits Section */}
            {hasSplits && (
                <div className="mt-3 pt-3 border-t">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                        Sectors
                    </div>

                    <div className="space-y-2">
                        {entry.bestLapSplits.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">
                                    Best:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {entry.bestLapSplits.map((split, i) => (
                                        <span
                                            key={`best-${i}`}
                                            className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
                                        >
                                            {formatTime(split)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {entry.splits.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">
                                    Theor:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {entry.splits.map((split, i) => (
                                        <span
                                            key={`theor-${i}`}
                                            className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
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
