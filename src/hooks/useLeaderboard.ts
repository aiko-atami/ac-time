import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '@/lib/api';
import type { ProcessedLeaderboard, CarClassRule } from '@/lib/types';

interface UseLeaderboardOptions {
    refreshInterval?: number; // Auto-refresh interval in milliseconds
    serverUrl?: string;       // Target AC server JSON URL
    classRules?: CarClassRule[]; // dynamic car class definitions
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
    const { refreshInterval, serverUrl, classRules } = options;

    const [data, setData] = useState<ProcessedLeaderboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetchLeaderboard(serverUrl, classRules);
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
    }, [refreshInterval, loadData, serverUrl]);

    return { data, loading, error, refetch: loadData };
}
