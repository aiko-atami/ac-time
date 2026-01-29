import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '@/lib/api';
import type { ProcessedLeaderboard } from '@/lib/types';

interface UseLeaderboardOptions {
    refreshInterval?: number; // Auto-refresh interval in milliseconds
}

interface UseLeaderboardReturn {
    data: ProcessedLeaderboard | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching leaderboard data
 * Supports auto-refresh and manual refetch
 */
export function useLeaderboard(
    options: UseLeaderboardOptions = {}
): UseLeaderboardReturn {
    const { refreshInterval } = options;

    const [data, setData] = useState<ProcessedLeaderboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetchLeaderboard();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Error loading leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh
    useEffect(() => {
        if (!refreshInterval) return;

        const interval = setInterval(loadData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, loadData]);

    return { data, loading, error, refetch: loadData };
}
