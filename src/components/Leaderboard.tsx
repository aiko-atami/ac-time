import { LeaderboardCard } from './LeaderboardCard';
import type { ProcessedEntry } from '@/lib/types';

interface LeaderboardProps {
    entries: ProcessedEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
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

    return (
        <div className="space-y-3 sm:space-y-4">
            {entries.map((entry, index) => (
                <LeaderboardCard
                    key={entry.id}
                    entry={entry}
                    position={index + 1}
                />
            ))}
        </div>
    );
}
