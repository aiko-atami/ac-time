import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLeaderboardFilters } from '@/hooks/useLeaderboardFilters';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { LeaderboardFilters } from '@/components/LeaderboardFilters';
import { Leaderboard } from '@/components/Leaderboard';

export function App() {
    // Fetch leaderboard data with 30s auto-refresh
    const { data, loading, error } = useLeaderboard({ refreshInterval: 30000 });

    // Filter and sort logic
    const {
        filtered,
        classes,
        selectedClass,
        setSelectedClass,
        sortBy,
        setSortBy,
        sortAsc,
        toggleSortDirection,
    } = useLeaderboardFilters(data?.leaderboard || []);

    // Loading state
    if (loading && !data) {
        return <LoadingState />;
    }

    // Error state
    if (error) {
        return <ErrorState message={error.message} />;
    }

    // No data
    if (!data) {
        return <ErrorState message="No data available" />;
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
                {/* Header */}
                <header className="mb-6 sm:mb-8">
                    <div className="space-y-1 mb-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                            {data.serverName || 'AC Live Timing'}
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {data.sessionName && (
                                <span className="font-semibold">
                                    {data.sessionName}
                                </span>
                            )}
                            {data.track && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <span>@ {data.track}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {data.lastUpdate && (
                        <p className="text-xs text-muted-foreground">
                            Updated: {new Date(data.lastUpdate).toLocaleTimeString()}
                        </p>
                    )}
                </header>

                {/* Error Message */}
                {data.error && (
                    <div className="mb-6 p-4 rounded-lg border border-destructive bg-destructive/10">
                        <div className="flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                                <strong className="font-semibold">Connection Error:</strong>{' '}
                                <span className="text-sm">{data.error}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <LeaderboardFilters
                    classes={classes}
                    selectedClass={selectedClass}
                    onClassChange={setSelectedClass}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortAsc={sortAsc}
                    onSortDirectionToggle={toggleSortDirection}
                />

                {/* Leaderboard */}
                <Leaderboard entries={filtered} />
            </div>
        </div>
    );
}

export default App;