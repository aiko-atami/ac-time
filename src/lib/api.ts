import type { ProcessedLeaderboard } from './types';
import { mockLeaderboardData } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || !API_URL;

/**
 * Fetch pre-processed leaderboard data from backend API
 * In development mode with no API_URL, uses mock data
 */
export async function fetchLeaderboard(): Promise<ProcessedLeaderboard> {
    // Use mock data in development
    if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockLeaderboardData;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/api/leaderboard`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as ProcessedLeaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);

        // Return error state with empty leaderboard
        return {
            leaderboard: [],
            serverName: '',
            track: '',
            sessionName: '',
            error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        };
    }
}
