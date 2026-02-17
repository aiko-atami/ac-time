import type { CarClassRule, ProcessedLeaderboard } from '@/shared/types'
import { mockLeaderboardData } from '@/shared/api/mock/leaderboard'
import { normalizeDriverName } from '@/shared/lib/driver-name'

const API_URL = import.meta.env.VITE_API_URL || ''
const REQUEST_TIMEOUT_MS = 5000

/**
 * Creates an empty leaderboard response with an error message.
 * @param message Human-readable failure message.
 * @returns Processed leaderboard fallback payload.
 */
function createErrorResult(message: string): ProcessedLeaderboard {
  return {
    leaderboard: [],
    serverName: '',
    track: '',
    sessionName: '',
    error: message,
  }
}

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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('Request timeout'), REQUEST_TIMEOUT_MS)

  try {
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      return createErrorResult('Leaderboard request timed out')
    }

    console.error('Error fetching leaderboard:', error)
    return createErrorResult(error instanceof Error ? error.message : 'Failed to fetch leaderboard')
  }
  finally {
    clearTimeout(timeoutId)
  }
}
