import { createServiceClient, HttpError, requireUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { enforceGenerationQuota, RateLimitError, type StaffRole } from '../_shared/rateLimit.ts'
import { sanitizeUnknown } from '../_shared/sanitize.ts'
import { createQuestionProvider } from './_providers/index.ts'
import type { ContentDraft, GenerateQuestionRequest } from './_providers/types.ts'

type Identity = { id: string; role: StaffRole }
type Dependencies = {
  authorize(request: Request): Promise<Identity>
  generate(request: GenerateQuestionRequest): Promise<ContentDraft[]>
  consumeQuota(userId: string, role: StaffRole, count: number): Promise<void>
  logUsage(userId: string, request: GenerateQuestionRequest, outcome: string): Promise<void>
}

function json(body: unknown, status: number, request: Request) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) })
}

function parseRequest(value: unknown): GenerateQuestionRequest {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'invalid_request')
  const input = value as Record<string, unknown>
  const part = Number(input.part); const count = Number(input.count)
  if (![1, 2, 3, 4, 5, 6, 7].includes(part) || !Number.isInteger(count) || count < 1 || count > 10
    || !['easy', 'medium', 'hard'].includes(String(input.difficulty)) || !Array.isArray(input.skills)
    || input.skills.some((skill) => typeof skill !== 'string') || typeof input.topic !== 'string'
    || input.topic.trim().length < 2 || input.topic.length > 100) throw new HttpError(400, 'invalid_request')
  return { part, count, difficulty: input.difficulty, skills: input.skills.slice(0, 10), topic: input.topic.trim() } as GenerateQuestionRequest
}

function validDraft(draft: unknown): draft is ContentDraft {
  if (!draft || typeof draft !== 'object') return false
  const value = draft as ContentDraft
  const expectedQuestions: Partial<Record<number, number>> = { 1: 1, 2: 1, 3: 3, 4: 3, 5: 1, 6: 4 }
  const validGroupSize = value.part === 7
    ? value.groupType === 'single_document' ? value.questions?.length >= 2 && value.questions.length <= 4
      : ['double_document', 'triple_document'].includes(value.groupType) && value.questions?.length === 5
    : value.questions?.length === expectedQuestions[value.part]
  return [1, 2, 3, 4, 5, 6, 7].includes(value.part) && typeof value.groupId === 'string'
    && ['easy', 'medium', 'hard'].includes(value.difficulty) && Array.isArray(value.media)
    && Array.isArray(value.questions) && validGroupSize
    && value.questions.every((question) => Array.isArray(question.choices)
      && question.choices.length === (value.part === 2 ? 3 : 4)
      && question.choices.filter((choice) => choice.correct === true).length === 1
      && Boolean(question.translations?.th?.explanation) && Boolean(question.translations?.en?.explanation)
      && (value.part > 4 || Boolean(question.translations?.th?.transcript) && Boolean(question.translations?.en?.transcript)))
}

export function createGenerateQuestionHandler(deps: Dependencies) {
  return async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
    if (request.method !== 'POST') return json({ code: 'method_not_allowed' }, 405, request)
    let identity: Identity | undefined; let input: GenerateQuestionRequest | undefined; let quotaConsumed = false
    try {
      identity = await deps.authorize(request)
      if (!['reviewer', 'admin'].includes(identity.role)) throw new HttpError(403, 'forbidden')
      let raw: unknown
      try { raw = await request.json() } catch { throw new HttpError(400, 'invalid_json') }
      input = parseRequest(raw)
      await deps.consumeQuota(identity.id, identity.role, input.count)
      quotaConsumed = true
      const drafts = (await deps.generate(input)).map((draft) => sanitizeUnknown(draft))
      if (drafts.length !== input.count || !drafts.every(validDraft)) throw new HttpError(422, 'invalid_provider_output')
      await deps.logUsage(identity.id, input, 'success')
      return json({ drafts: drafts.map((draft) => ({ status: 'draft', content: draft })) }, 200, request)
    } catch (error) {
      const status = error instanceof HttpError ? error.status : error instanceof RateLimitError ? 429 : 500
      const code = error instanceof HttpError || error instanceof RateLimitError ? error.message : 'internal_error'
      if (identity && input && quotaConsumed) {
        try { await deps.logUsage(identity.id, input, code) } catch { /* Preserve the original response. */ }
      }
      if (status >= 500) console.error(error)
      return json({ code }, status, request)
    }
  }
}

async function defaultIdentity(request: Request): Promise<Identity> {
  const user = await requireUser(request); const client = createServiceClient()
  const { data, error } = await client.from('user_roles').select('role').eq('user_id', user.id)
  if (error) throw error
  const roles = (data ?? []).map((row) => row.role as StaffRole)
  return { id: user.id, role: roles.includes('admin') ? 'admin' : roles.includes('reviewer') ? 'reviewer' : 'user' }
}

const defaultHandler = createGenerateQuestionHandler({
  authorize: defaultIdentity,
  generate: (request) => createQuestionProvider().generate(request),
  consumeQuota: (userId, role, count) => enforceGenerationQuota(createServiceClient() as never, userId, role, count),
  logUsage: async (userId, request, outcome) => {
    const { error } = await createServiceClient().from('ai_generation_usage').insert({
      user_id: userId, requested_count: request.count, part: request.part,
      model: Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite', outcome,
    })
    if (error) throw error
  },
})

if (import.meta.main) Deno.serve(defaultHandler)
