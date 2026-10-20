import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
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
    return new Response(JSON.stringify({ error: { message: 'Unsupported schema field' } }), { status: 400 })
  } })
  await assertRejects(() => provider.generate(request), Error, 'gemini_400: Unsupported schema field')
  assertEquals(calls, 1)
})

Deno.test('Gemini requests structured output matching the selected Part', async () => {
  let sentBody: Record<string, unknown> = {}
  const provider = new GeminiQuestionProvider({ apiKey: 'server-secret', model: 'test-model', fetcher: async (_url, init) => {
    sentBody = JSON.parse(String(init?.body))
    return success.clone()
  } })
  await provider.generate(request)
  const config = sentBody.generationConfig as Record<string, unknown>
  const format = config.responseFormat as { text: { mimeType: string; schema: { minItems: number; maxItems: number } } }
  assertEquals(format.text.mimeType, 'application/json')
  assertEquals(format.text.schema.minItems, 1)
  assertEquals(format.text.schema.maxItems, 1)
})
