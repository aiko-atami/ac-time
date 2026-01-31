import type { CarClassRule } from './types'

export const DEFAULT_CLASS_RULES: CarClassRule[] = [
  { name: 'Серебро', patterns: ['SUPER-PRODUCTION'] },
  { name: 'Бронза', patterns: ['Concept C GT'] },
]

export const DEFAULT_SERVER_URL = 'https://ac8.yoklmnracing.ru/api/live-timings/leaderboard.json'
export const DEFAULT_REFRESH_INTERVAL = 5 * 60000
