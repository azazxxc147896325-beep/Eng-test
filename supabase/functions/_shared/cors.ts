export function corsHeaders(request: Request) {
  const configuredOrigin = Deno.env.get('APP_ORIGIN') ?? 'http://127.0.0.1:4173'
  const requestOrigin = request.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': requestOrigin === configuredOrigin ? requestOrigin : configuredOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }
}
