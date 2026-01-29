import { useMemo, useState } from 'react';
import type { ProcessedEntry } from '@/lib/types';

type SortField = 'lapTime' | 'driver' | 'laps';

interface UseLeaderboardFiltersReturn {
    filtered: ProcessedEntry[];
    classes: string[];
    selectedClass: string;
    setSelectedClass: (value: string) => void;
    sortBy: SortField;
    setSortBy: (value: SortField) => void;
    sortAsc: boolean;
    setSortAsc: (value: boolean) => void;
    toggleSortDirection: () => void;
}

/**
 * Custom hook for filtering and sorting leaderboard data
 * Handles car class filtering and multi-field sorting
 */
export function useLeaderboardFilters(
    entries: ProcessedEntry[]
): UseLeaderboardFiltersReturn {
    const [selectedClass, setSelectedClass] = useState<string>('All');
    const [sortBy, setSortBy] = useState<SortField>('lapTime');
    const [sortAsc, setSortAsc] = useState(true);

    // Get unique car classes
    const classes = useMemo(() => {
        const uniqueClasses = new Set(entries.map(e => e.carClass));
        return ['All', ...Array.from(uniqueClasses)];
    }, [entries]);

    // Filter and sort data
    const filtered = useMemo(() => {
        let result = [...entries];

        // Filter by class
        if (selectedClass !== 'All') {
            result = result.filter(e => e.carClass === selectedClass);
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'lapTime':
                    if (a.bestLap === null && b.bestLap === null) comparison = 0;
                    else if (a.bestLap === null) comparison = 1;
                    else if (b.bestLap === null) comparison = -1;
                    else comparison = a.bestLap - b.bestLap;
                    break;
                case 'driver':
                    comparison = a.driverName.localeCompare(b.driverName);
                    break;
                case 'laps':
                    comparison = b.lapCount - a.lapCount; // Descending by default
                    break;
            }

            return sortAsc ? comparison : -comparison;
        });

        return result;
    }, [entries, selectedClass, sortBy, sortAsc]);

    const toggleSortDirection = () => setSortAsc(!sortAsc);

    return {
        filtered,
        classes,
        selectedClass,
        setSelectedClass,
        sortBy,
        setSortBy,
        sortAsc,
        setSortAsc,
        toggleSortDirection,
    };
}
