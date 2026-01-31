import type { CarClassRule } from './types'

const API_URL = import.meta.env.VITE_API_URL || ''

export const CSV_URL = `${API_URL}/api/participants`
export const DEFAULT_CLASS_RULES: CarClassRule[] = [
  { name: 'Серебро', patterns: ['SUPER-PRODUCTION'] },
  { name: 'Бронза', patterns: ['Concept C GT'] },
]

export const DEFAULT_SERVER_URL = 'https://ac8.yoklmnracing.ru/api/live-timings/leaderboard.json'
export const DEFAULT_REFRESH_INTERVAL = 5 * 60000
