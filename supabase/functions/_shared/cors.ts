export function corsHeaders(request: Request) {
  let configuredOrigins = 'http://127.0.0.1:4173'
  try { configuredOrigins = Deno.env.get('APP_ORIGIN') ?? configuredOrigins } catch { /* Tests run without env permission. */ }
  const allowedOrigins = configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
  const requestOrigin = request.headers.get('origin')
  const responseOrigin = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }
}
