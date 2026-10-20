import { assertEquals } from 'jsr:@std/assert@1'
import { GeminiQuestionProvider } from './gemini.ts'

const request = { part: 5 as const, count: 1, difficulty: 'medium' as const, skills: [], topic: 'office' }
const success = new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), { status: 200 })

Deno.test('Gemini retries one transient response', async () => {
  let calls = 0
  const provider = new GeminiQuestionProvider({ apiKey: 'server-secret', model: 'test-model', fetcher: async () => {
    calls += 1
    return calls === 1 ? new Response('', { status: 500 }) : success.clone()
  } })
  await provider.generate(request)
  assertEquals(calls, 2)
})

Deno.test('Gemini does not retry a validation/client response', async () => {
  let calls = 0
  const provider = new GeminiQuestionProvider({ apiKey: 'server-secret', model: 'test-model', fetcher: async () => {
    calls += 1
    return new Response('', { status: 400 })
  } })
  try { await provider.generate(request) } catch { /* Expected. */ }
  assertEquals(calls, 1)
})
