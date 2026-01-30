import { Card } from '@/components/ui/card';
import { CarClassBadge } from './CarClassBadge';
import { formatTime } from '@/lib/utils';
import { cardPadding } from '@/lib/styles';
import { useLeaderboardEntry } from '@/hooks/useLeaderboardEntry';
import type { ProcessedEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface LeaderboardRowProps {
    entry: ProcessedEntry;
    position: number;
    bestOverallLap: number | null;
}

export function LeaderboardRow({ entry, position, bestOverallLap }: LeaderboardRowProps) {
    const { percentage, badgeClass, tooltipText } = useLeaderboardEntry(entry, bestOverallLap);

    return (
        <Card className={cardPadding.row}>
            <div className="flex items-center gap-2">
                {/* Position */}
                <span className="text-base font-bold text-primary w-8 shrink-0">
                    #{position}
                </span>

                {/* Driver + Team */}
                <div className="flex flex-col min-w-0 w-48 shrink-0">
                    <span className="font-semibold text-sm truncate">
                        {entry.driverName}
                    </span>
                    {entry.teamName && (
                        <span className="text-xs text-muted-foreground truncate">
                            {entry.teamName}
                        </span>
                    )}
                </div>

                {/* Car */}
                <span className="text-sm text-muted-foreground truncate w-40 shrink-0 hidden lg:block">
                    {entry.carName}
                </span>

                {/* Class Badge - equal width with time section */}
                <div className="flex-1 basis-0 min-w-0">
                    <CarClassBadge carClass={entry.carClass} />
                </div>

                {/* Best Lap + Percentage + Theor with native tooltip - equal width with class section */}
                <div
                    className="flex items-center gap-1.5 flex-1 basis-0 min-w-0 cursor-help"
                    title={tooltipText}
                >
                    <span className="text-sm font-semibold font-mono text-primary">
                        {formatTime(entry.bestLap)}
                    </span>
                    {percentage && percentage >= 100 && (
                        <Badge variant="outline" className={`h-5 px-1.5 font-mono text-[10px] ${badgeClass}`}>
                            {Math.floor(percentage)}%
                        </Badge>
                    )}
                    <span className="text-sm font-mono text-muted-foreground">
                        {formatTime(entry.theoreticalBestLap)}
                    </span>
                </div>

                {/* Laps */}
                <div className="flex items-center gap-1 shrink-0 w-16">
                    <span className="text-xs text-muted-foreground">Laps:</span>
                    <span className="text-sm font-semibold">{entry.lapCount}</span>
                </div>
            </div>
        </Card>
    );
}
