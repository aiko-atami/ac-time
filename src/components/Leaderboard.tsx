import { LeaderboardCard } from './LeaderboardCard';
import { LeaderboardRow } from './LeaderboardRow';
import { useChampionshipParticipants } from '@/hooks/useChampionshipParticipants';
import type { ProcessedEntry } from '@/lib/types';

interface LeaderboardProps {
    entries: ProcessedEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
    const { isRegistered } = useChampionshipParticipants();

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
        );
    }

    // Find overall best lap for percentage calculation
    // Calculate the best lap from the current entries (filtered/sorted)
    const bestOverallLap = entries.reduce((min, entry) => {
        if (entry.bestLap === null) return min;
        if (min === null) return entry.bestLap;
        return entry.bestLap < min ? entry.bestLap : min;
    }, null as number | null);

    return (
        <>
            {/* Mobile: Cards */}
            <div className="space-y-2 sm:space-y-2.5 md:hidden">
                {entries.map((entry, index) => (
                    <LeaderboardCard
                        key={entry.id}
                        entry={entry}
                        position={index + 1}
                        bestOverallLap={bestOverallLap}
                        isRegistered={isRegistered(entry)}
                    />
                ))}
            </div>

            {/* Desktop: Compact Rows */}
            <div className="hidden md:block space-y-1.5">
                {entries.map((entry, index) => (
                    <LeaderboardRow
                        key={entry.id}
                        entry={entry}
                        position={index + 1}
                        bestOverallLap={bestOverallLap}
                        isRegistered={isRegistered(entry)}
                    />
                ))}
            </div>
        </>
    );
}
