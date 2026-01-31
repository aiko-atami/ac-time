import type { CarClassRule, LeaderboardData } from '../../src/lib/types'
import { processLeaderboard } from '../../src/lib/transform'

const TIMEOUT_MS = 10000
const DEFAULT_AC_API_URL = 'https://ac7.yoklmnracing.ru/api/live-timings/leaderboard.json'

export async function onRequest(context: { request: Request }) {
  const { request } = context
  const url = new URL(request.url)

  // Get target URL from query param or use default
  const targetUrl = url.searchParams.get('url') || DEFAULT_AC_API_URL

  // Get car class rules from query param
  let carClassRules: CarClassRule[] = []
  const rulesParam = url.searchParams.get('rules')
  if (rulesParam) {
    try {
      carClassRules = JSON.parse(decodeURIComponent(rulesParam))
    }
    catch (e) {
      console.warn('Failed to parse car class rules:', e)
    }
  }

  // 1. CORS Headers - Allow access from anywhere (or specifically localhost:5173)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // 2. Handle Preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate URL
    const _ = new URL(targetUrl) // Will throw if invalid
    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`AC API returned ${response.status}`)
    }

    const data = await response.json() as LeaderboardData
    const processed = processLeaderboard(data, carClassRules)

    return new Response(JSON.stringify({
      leaderboard: processed,
      serverName: data.ServerName,
      track: data.Track,
      sessionName: data.Name,
      lastUpdate: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders, // Add CORS headers to success response
      },
    })
  }
  catch (error) {
    console.error('Error fetching leaderboard:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch leaderboard',
        leaderboard: [],
        serverName: '',
        track: '',
        sessionName: '',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders, // Add CORS headers to error response
        },
      },
    )
  }
}
