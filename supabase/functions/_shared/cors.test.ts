import { assertEquals } from 'jsr:@std/assert@1'
import { corsHeaders } from './cors.ts'

Deno.test('allows any origin configured in APP_ORIGIN', () => {
  const previous = Deno.env.get('APP_ORIGIN')
  Deno.env.set('APP_ORIGIN', 'http://localhost:5173, https://azazxxc147896325-beep.github.io')
  try {
    const request = new Request('https://example.test', {
      headers: { origin: 'https://azazxxc147896325-beep.github.io' },
    })
    assertEquals(corsHeaders(request)['Access-Control-Allow-Origin'], 'https://azazxxc147896325-beep.github.io')
  } finally {
    if (previous === undefined) Deno.env.delete('APP_ORIGIN')
    else Deno.env.set('APP_ORIGIN', previous)
  }
})

Deno.test('does not reflect an origin outside the configured list', () => {
  const previous = Deno.env.get('APP_ORIGIN')
  Deno.env.set('APP_ORIGIN', 'http://localhost:5173,https://azazxxc147896325-beep.github.io')
  try {
    const request = new Request('https://example.test', {
      headers: { origin: 'https://attacker.example' },
    })
    assertEquals(corsHeaders(request)['Access-Control-Allow-Origin'], 'http://localhost:5173')
  } finally {
    if (previous === undefined) Deno.env.delete('APP_ORIGIN')
    else Deno.env.set('APP_ORIGIN', previous)
  }
})
