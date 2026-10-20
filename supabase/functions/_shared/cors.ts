export function corsHeaders(request: Request) {
  let configuredOrigin = 'http://127.0.0.1:4173'
  try { configuredOrigin = Deno.env.get('APP_ORIGIN') ?? configuredOrigin } catch { /* Tests run without env permission. */ }
  const requestOrigin = request.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': requestOrigin === configuredOrigin ? requestOrigin : configuredOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }
}
