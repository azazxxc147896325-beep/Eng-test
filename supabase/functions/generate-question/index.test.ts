import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1'
import { createGenerateQuestionHandler } from './index.ts'
import type { ContentDraft, GenerateQuestionRequest } from './_providers/types.ts'
import { RateLimitError } from '../_shared/rateLimit.ts'

const validDraft: ContentDraft = {
  groupId: 'generated-1', part: 5, groupType: 'single_question', difficulty: 'medium', media: [],
  questions: [{
    id: 'q1', prompt: { text: '<b>Choose</b> the answer<script>alert(1)</script>' }, choiceShuffleAllowed: true,
    choices: [
      { id: 'a', label: 'A', content: { text: 'one' }, correct: true },
      { id: 'b', label: 'B', content: { text: 'two' }, correct: false },
      { id: 'c', label: 'C', content: { text: 'three' }, correct: false },
      { id: 'd', label: 'D', content: { text: 'four' }, correct: false },
    ],
    translations: {
      th: { explanation: 'คำอธิบาย' },
      en: { explanation: 'Explanation' },
    },
  }],
}

function request(body: unknown) {
  return new Request('http://localhost/generate-question', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

Deno.test('blocks users without reviewer or admin role', async () => {
  const handler = createGenerateQuestionHandler({
    authorize: async () => ({ id: 'u1', role: 'user' }),
    generate: async () => [validDraft], consumeQuota: async () => {}, logUsage: async () => {},
  })
  assertEquals((await handler(request({ part: 5, count: 1, difficulty: 'medium', skills: [], topic: 'office' }))).status, 403)
})

Deno.test('rejects malformed generation input without calling provider', async () => {
  let called = false
  const handler = createGenerateQuestionHandler({
    authorize: async () => ({ id: 'u1', role: 'admin' }),
    generate: async () => { called = true; return [validDraft] },
    consumeQuota: async () => {}, logUsage: async () => {},
  })
  const response = await handler(request({ part: 9, count: 99 }))
  assertEquals(response.status, 400)
  assertEquals(called, false)
})

Deno.test('returns sanitized drafts and never publishes provider output', async () => {
  const handler = createGenerateQuestionHandler({
    authorize: async () => ({ id: 'u1', role: 'reviewer' }),
    generate: async (_input: GenerateQuestionRequest) => [validDraft],
    consumeQuota: async () => {}, logUsage: async () => {},
  })
  const response = await handler(request({ part: 5, count: 1, difficulty: 'medium', skills: ['grammar'], topic: 'office' }))
  const body = await response.json()
  assertEquals(response.status, 200)
  assertEquals(body.drafts[0].status, 'draft')
  const prompt = JSON.stringify(body.drafts[0].content.questions[0].prompt)
  assertEquals(prompt.includes('<'), false)
  assertEquals(prompt.includes('script'), false)
  assertStringIncludes(prompt, 'Choose')
})

Deno.test('returns 429 before provider generation when daily quota is exhausted', async () => {
  let called = false
  const handler = createGenerateQuestionHandler({
    authorize: async () => ({ id: 'u1', role: 'reviewer' }),
    generate: async () => { called = true; return [validDraft] },
    consumeQuota: async () => { throw new RateLimitError('daily_generation_limit') },
    logUsage: async () => {},
  })
  const response = await handler(request({ part: 5, count: 1, difficulty: 'medium', skills: [], topic: 'office' }))
  assertEquals(response.status, 429)
  assertEquals(called, false)
})

Deno.test('rejects structurally invalid provider output', async () => {
  const handler = createGenerateQuestionHandler({
    authorize: async () => ({ id: 'u1', role: 'admin' }),
    generate: async () => [{ ...validDraft, questions: [] }],
    consumeQuota: async () => {}, logUsage: async () => {},
  })
  const response = await handler(request({ part: 5, count: 1, difficulty: 'medium', skills: [], topic: 'office' }))
  assertEquals(response.status, 422)
})
