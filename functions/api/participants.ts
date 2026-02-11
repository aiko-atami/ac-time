// @anchor: leaderboard/functions/api/participants
// @intent: Proxy participants CSV from configurable source URL with CORS headers.
import { getCorsHeaders, handleOptions } from './_cors'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

/**
 * Rewrites known GitHub UI links to raw file URLs.
 * @param csvUrl Valid HTTP(S) URL string.
 * @returns Normalized URL better suited for machine CSV fetches.
 */
function normalizeCsvSourceUrl(csvUrl: string): string {
  try {
    const parsed = new URL(csvUrl)

    // Convert:
    // https://github.com/{owner}/{repo}/blob/{ref}/{path}
    // to:
    // https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}
    if (parsed.hostname === 'github.com') {
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      if (pathParts.length >= 5 && pathParts[2] === 'blob') {
        const owner = pathParts[0]
        const repo = pathParts[1]
        const ref = pathParts[3]
        const filePath = pathParts.slice(4).join('/')
        return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`
      }
    }
  }
  catch {
    // keep original URL - validation is done elsewhere
  }

  return csvUrl
}

/**
 * Checks whether fetched payload looks like HTML page instead of CSV/plain text.
 * @param contentType Response Content-Type header value.
 * @param body Fetched body text.
 * @returns True when response appears to be HTML.
 */
function isHtmlPayload(contentType: string | null, body: string): boolean {
  if (contentType?.toLowerCase().includes('text/html')) {
    return true
  }

  const trimmed = body.trimStart().slice(0, 256).toLowerCase()
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
}

/**
 * Resolves target CSV URL from request query string.
 * @param request Incoming request object.
 * @returns Valid source URL or null when query parameter is absent/invalid.
 */
function resolveCsvUrl(request: Request): string | null {
  const requestUrl = new URL(request.url)
  const rawCsvUrl = requestUrl.searchParams.get('csvUrl')?.trim()
  if (!rawCsvUrl) {
    return null
  }

  try {
    const parsed = new URL(rawCsvUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  }
  catch {
    return null
  }
}

/**
 * Builds an empty CSV response to keep client participant list safely empty on errors.
 * @param corsHeaders CORS headers for the current request origin.
 * @returns Empty CSV response with no-store caching.
 */
function createEmptyCsvResponse(corsHeaders: HeadersInit): Response {
  return new Response('', {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  })
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
  const csvUrl = resolveCsvUrl(request)
  if (!csvUrl) {
    return createEmptyCsvResponse(corsHeaders)
  }

  try {
    const sourceUrl = normalizeCsvSourceUrl(csvUrl)
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/csv,text/plain;q=0.9,*/*;q=0.1',
      },
    })

    if (!response.ok) {
      return createEmptyCsvResponse(corsHeaders)
    }

    const data = await response.text()
    if (isHtmlPayload(response.headers.get('Content-Type'), data)) {
      return createEmptyCsvResponse(corsHeaders)
    }

    return new Response(data, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        ...corsHeaders,
      },
    })
  }
  catch {
    return createEmptyCsvResponse(corsHeaders)
  }
}
