import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLeaderboardFilters } from '@/hooks/useLeaderboardFilters';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { LeaderboardFilters } from '@/components/LeaderboardFilters';
import { Leaderboard } from '@/components/Leaderboard';
import { SettingsDialog } from '@/components/SettingsDialog';
import type { CarClassRule } from '@/lib/types';

export function App() {
    const [serverUrl, setServerUrl] = useState(() => {
        return localStorage.getItem('ac-time-server-url') || 'https://ac8.yoklmnracing.ru/api/live-timings/leaderboard.json';
    });

    const [carClasses, setCarClasses] = useState<CarClassRule[]>(() => {
        const saved = localStorage.getItem('ac-time-car-classes');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved classes", e);
            }
        }
        // Default Car Class Rules (matches previous hardcoded logic)
        return [
            { name: 'Super Production', patterns: ['SUPER-PRODUCTION'] },
            { name: 'Lada C GT', patterns: ['Concept C GT'] },
        ];
    });

    const handleSettingsSave = (url: string, classes: CarClassRule[]) => {
        setServerUrl(url);
        setCarClasses(classes);
        localStorage.setItem('ac-time-server-url', url);
        localStorage.setItem('ac-time-car-classes', JSON.stringify(classes));
    };

    // Fetch leaderboard data with 60s auto-refresh
    const { data, loading, error } = useLeaderboard({
        serverUrl,
        refreshInterval: 60000,
        classRules: carClasses
    });

    // Filter and sort logic
    // Ensure we have a valid array even if data is null
    const {
        filtered,
        classes,
        selectedClass,
        setSelectedClass,
        sortBy,
        setSortBy,
        sortAsc,
        toggleSortDirection,
        showRegisteredOnly,
        setShowRegisteredOnly,
    } = useLeaderboardFilters(data?.leaderboard || []);

    const renderHeader = () => (
        <header className="mb-4 sm:mb-5">
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 mb-1 min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                        {data?.serverName || 'AC Live Timing'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {data?.sessionName && (
                            <span className="font-semibold">
                                {data.sessionName}
                            </span>
                        )}
                        {data?.track && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>@ {data.track}</span>
                            </>
                        )}
                    </div>
                </div>

                <SettingsDialog
                    serverUrl={serverUrl}
                    carClasses={carClasses}
                    onSave={handleSettingsSave}
                />
            </div>

            {data?.lastUpdate && (
                <p className="text-xs text-muted-foreground">
                    Updated: {new Date(data.lastUpdate).toLocaleTimeString()}
                </p>
            )}
        </header>
    );

    const renderMainContent = () => {
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
            <>
                {/* Error Message (Partial) */}
                {data.error && (
                    <div className="mb-4 p-3 rounded-lg border border-destructive bg-destructive/10">
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
                    showRegisteredOnly={showRegisteredOnly}
                    onToggleRegisteredOnly={setShowRegisteredOnly}
                />

                {/* Leaderboard */}
                <Leaderboard entries={filtered} />
            </>
        );
    };

    return (
        <div className="min-h-screen relative">
            <div className="container mx-auto px-3 py-4 sm:py-5 max-w-4xl md:max-w-6xl lg:max-w-7xl">
                {renderHeader()}
                {renderMainContent()}
            </div>
        </div>
    );
}

export default App;