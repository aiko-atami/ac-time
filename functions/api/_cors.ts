export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')
  const host = request.headers.get('Host')

  let isAllowed = !origin // Allow non-browser requests

  if (origin) {
    try {
      const { hostname, host: originHost } = new URL(origin)
      // Allow localhost (dev) or same domain (production)
      isAllowed = hostname === 'localhost' || hostname === '127.0.0.1' || originHost === host
    }
    catch { }
  }

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export function handleOptions(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: getCorsHeaders(request),
    })
  }
  return null
}
