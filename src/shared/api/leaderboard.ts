import type { CarClassRule, ProcessedLeaderboard } from '@/shared/types'
import { mockLeaderboardData } from '@/shared/api/mock/leaderboard'
import { normalizeDriverName } from '@/shared/lib/driver-name'

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Fetch pre-processed leaderboard data from backend API
 * In development mode with no API_URL, uses mock data
 */
export async function fetchLeaderboard(
  serverUrl?: string,
  classRules?: CarClassRule[],
): Promise<ProcessedLeaderboard> {
  // Use mock data only if explicitly enabled via environment variable
  if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockLeaderboardData
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Build URL with query params
    let endpoint = `${API_URL}/api/leaderboard`
    const params = new URLSearchParams()

    if (serverUrl) {
      params.append('url', serverUrl)
    }

    if (classRules && classRules.length > 0) {
      params.append('rules', JSON.stringify(classRules))
    }

    const queryString = params.toString()
    if (queryString) {
      endpoint += `?${queryString}`
    }

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as ProcessedLeaderboard

    return {
      ...data,
      leaderboard: data.leaderboard.map(entry => ({
        ...entry,
        driverName: normalizeDriverName(entry.driverName),
      })),
    }
  }
  catch (error) {
    console.error('Error fetching leaderboard:', error)

    // Return error state with empty leaderboard
    return {
      leaderboard: [],
      serverName: '',
      track: '',
      sessionName: '',
      error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
    }
  }
}
