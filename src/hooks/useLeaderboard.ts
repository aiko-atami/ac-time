import { useState, useEffect, useRef } from 'react';
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

    // Keep refs to latest values for use in interval callback
    const serverUrlRef = useRef(serverUrl);
    const classRulesRef = useRef(classRules);
    serverUrlRef.current = serverUrl;
    classRulesRef.current = classRules;

    // Stable fetch function using refs
    const loadData = async () => {
        try {
            setLoading(true);
            const result = await fetchLeaderboard(serverUrlRef.current, classRulesRef.current);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Error loading leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    // Serialize classRules for dependency comparison
    const classRulesKey = JSON.stringify(classRules);

    // Fetch on mount and when serverUrl or classRules change
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl, classRulesKey]);

    // Auto-refresh interval
    useEffect(() => {
        if (!refreshInterval) return;

        const interval = setInterval(loadData, refreshInterval);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshInterval]);

    return { data, loading, error, refetch: loadData };
}
