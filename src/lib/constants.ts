// @anchor: leaderboard/shared/constants
// @intent: Shared constants for defaults, API endpoints, and localStorage keys.
import type { CarClassRule } from './types'

export const DEFAULT_PARTICIPANTS_CSV_URL = ''

export const LEGACY_SERVER_URL_KEY = 'ac-time-server-url'
export const LEGACY_CAR_CLASSES_KEY = 'ac-time-car-classes'
export const LEGACY_PARTICIPANTS_CSV_URL_KEY = 'ac-time-participants-csv-url'
export const LEGACY_SETTINGS_PRESETS_STORAGE_KEY = 'ac-time-settings-presets'
export const SETTINGS_PRESETS_STORAGE_KEY = 'settings-presets'

export const DEFAULT_CLASS_RULES: CarClassRule[] = [
  { name: 'Серебро', patterns: ['SUPER-PRODUCTION'] },
  { name: 'Бронза', patterns: ['Concept C GT'] },
]

export const DEFAULT_SERVER_URL = 'https://ac8.yoklmnracing.ru/api/live-timings/leaderboard.json'
export const DEFAULT_PACE_PERCENT_THRESHOLD = 107
export const MIN_PACE_PERCENT_THRESHOLD = 101
export const MAX_PACE_PERCENT_THRESHOLD = 115
export const DEFAULT_REFRESH_INTERVAL = 5 * 60000
export const DEFAULT_SETTINGS_PRESET_NAME = 'Default'
