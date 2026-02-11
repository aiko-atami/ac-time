// @anchor: leaderboard/functions/api/participants
// @intent: Proxy participants CSV from the default source with CORS headers.
import { getCorsHeaders, handleOptions } from './_cors'

const DEFAULT_CSV_URL = 'https://github.com/aiko-atami/ac-time/releases/download/championship-537/participants-537.csv'

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

  try {
    const response = await fetch(DEFAULT_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
