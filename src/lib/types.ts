/**
 * Type definitions for AC Live Timing data
 * 
 * Backend API returns pre-processed data in ProcessedEntry[] format
 */

export interface ProcessedEntry {
    id: string;                       // `${driverGUID}_${carModel}`
    driverName: string;
    carName: string;
    carModel: string;
    carClass: string;                 // GT3, GT4, Porsche Cup, Super Production, Other
    teamName: string;
    bestLap: number | null;           // Milliseconds (already converted by backend)
    splits: (number | null)[];        // Best splits from different laps (theoretical)
    bestLapSplits: (number | null)[]; // Splits from the actual best lap
    theoreticalBestLap: number | null;// Sum of splits (if all splits valid)
    lapCount: number;
}

export interface ProcessedLeaderboard {
    leaderboard: ProcessedEntry[];
    serverName: string;
    track: string;
    sessionName: string;
    lastUpdate?: string;
    error?: string;
}

export interface ServerInfo {
    serverName?: string;
    track?: string;
    sessionName?: string;
}
