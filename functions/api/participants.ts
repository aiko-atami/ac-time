// @anchor: leaderboard/functions/api/participants
// @intent: Proxy participants CSV from configurable source URL with CORS headers.
import { getCorsHeaders, handleOptions } from './_cors'

const DEFAULT_CSV_URL = 'https://github.com/aiko-atami/ac-time/releases/download/championship-537/participants-537.csv'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

/**
 * Resolves target CSV URL from request query string.
 * @param request Incoming request object.
 * @returns Valid source URL and optional validation error.
 */
function resolveCsvUrl(request: Request): { csvUrl: string, error: string | null } {
  const requestUrl = new URL(request.url)
  const rawCsvUrl = requestUrl.searchParams.get('csvUrl')?.trim()
  if (!rawCsvUrl) {
    return { csvUrl: DEFAULT_CSV_URL, error: null }
  }

  try {
    const parsed = new URL(rawCsvUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { csvUrl: DEFAULT_CSV_URL, error: 'Invalid csvUrl: only http/https are allowed.' }
    }
    return { csvUrl: parsed.toString(), error: null }
  }
  catch {
    return { csvUrl: DEFAULT_CSV_URL, error: 'Invalid csvUrl query parameter.' }
  }
}

/**
 * Handles participants CSV proxy endpoint.
 * @param context Cloudflare request context.
 * @param context.request Incoming request object.
 * @returns CSV response with CORS headers.
 */
export async function onRequest(context: { request: Request }) {
  const { request } = context

  // Handle Preflight (OPTIONS)
  const optionsResponse = handleOptions(request)
  if (optionsResponse) {
    return optionsResponse
  }

  const corsHeaders = getCorsHeaders(request)
  const { csvUrl, error } = resolveCsvUrl(request)

  if (error) {
    return new Response(error, {
      status: 400,
      headers: corsHeaders,
    })
  }

  try {
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      return new Response(`Failed to fetch CSV: ${response.statusText}`, {
        status: response.status,
        headers: corsHeaders,
      })
    }

    const data = await response.text()

    return new Response(data, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        ...corsHeaders,
      },
    })
  }
  catch (err) {
    return new Response(`Server error: ${err}`, {
      status: 500,
      headers: corsHeaders,
    })
  }
}
