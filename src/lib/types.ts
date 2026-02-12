// @anchor: leaderboard/shared/types
// @intent: Central shared types for API payloads, settings, and leaderboard processing.
/**
 * Type definitions for AC Live Timing data.
 *
 * Shared between frontend and backend (Cloudflare Functions).
 */

export interface Driver {
  CarInfo?: {
    DriverName: string
    TeamName: string
    DriverGUID: string
  }
  Cars?: Record<string, CarData>
}

export interface CarData {
  CarName?: string
  BestLap?: number
  BestSplits?: Record<string, { SplitTime?: number }>
  BestLapSplits?: Record<string, { SplitTime?: number }>
  NumLaps?: number
}

export interface LeaderboardData {
  ConnectedDrivers?: Driver[]
  DisconnectedDrivers?: Driver[]
  ServerName?: string
  Track?: string
  Name?: string
}

export interface ConnectedDriver {
  CarInfo: {
    DriverName: string
    TeamName: string
    DriverGUID: string
  }
  Cars: Record<string, CarData>
}

export interface ProcessedEntry {
  id: string // `${driverGUID}_${carModel}`
  driverName: string
  carName: string
  carModel: string
  carClass: string // GT3, GT4, Porsche Cup, Super Production, Other
  teamName: string
  bestLap: number | null // Milliseconds (already converted by backend)
  splits: (number | null)[] // Best splits from different laps (theoretical)
  bestLapSplits: (number | null)[] // Splits from the actual best lap
  theoreticalBestLap: number | null// Sum of splits (if all splits valid)
  lapCount: number
}

export interface ProcessedLeaderboard {
  leaderboard: ProcessedEntry[]
  serverName: string
  track: string
  sessionName: string
  lastUpdate?: string
  error?: string
}

export interface CarClassRule {
  name: string
  patterns: string[] // Substrings to match in car name/model (case-insensitive)
}

export interface ServerInfo {
  serverName?: string
  track?: string
  sessionName?: string
}

export interface ParticipantSourceConfig {
  csvUrl: string
}

export interface SettingsSnapshot {
  serverUrl: string
  carClasses: CarClassRule[]
  participants: ParticipantSourceConfig
  pacePercentThreshold: number
}

export interface SettingsPreset {
  id: string
  name: string
  settings: SettingsSnapshot
  createdAt: string
  updatedAt: string
}

export interface SettingsPresetsState {
  version: 1
  activePresetId: string | null
  presets: SettingsPreset[]
}
