import { createServiceClient, HttpError, requireUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

type ServiceClient = ReturnType<typeof createServiceClient>

async function ownedAttempt(client: ServiceClient, userId: string, attemptId: string) {
  const { data, error } = await client.from('attempts').select('id, mode, locale, status, timing_unverified, submitted_at')
    .eq('id', attemptId).eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'attempt_not_found')
  return data
}

function scoreDto(score: Record<string, unknown>, mode: 'full' | 'quick' | 'practice') {
  const rawParts = ((score.breakdown as { parts?: Record<string, { correct: number; total: number; accuracy: number }> })?.parts ?? {})
  const parts = Object.entries(rawParts).map(([part, value]) => ({ part: Number(part), ...value })).sort((a, b) => a.part - b.part)
  const totalAnswered = parts.reduce((sum, part) => sum + part.total, 0)
  const totalCorrect = parts.reduce((sum, part) => sum + part.correct, 0)
  const accuracy = totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0
  const estimate = Number(score.total_scaled ?? 10)
  return {
    mode, scoringVersion: score.scoring_version,
    section: mode === 'practice' ? { listening: null, reading: null } : { listening: score.listening_scaled, reading: score.reading_scaled },
    total: mode === 'full' ? score.total_scaled : null,
    range: mode === 'quick' ? { min: Math.max(10, estimate - 80), max: Math.min(990, estimate + 80), confidence: 'low' } : null,
    accuracy, parts, skills: {},
    weakParts: parts.filter((part) => part.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map((part) => part.part),
  }
}

async function resultPayload(client: ServiceClient, userId: string, attemptId: string) {
  const attempt = await ownedAttempt(client, userId, attemptId)
  if (attempt.status !== 'submitted') throw new HttpError(409, 'result_unavailable')
  const { data: score, error } = await client.from('score_results').select('*').eq('attempt_id', attemptId).eq('user_id', userId).single()
  if (error) throw error
  return scoreDto(score as unknown as Record<string, unknown>, attempt.mode)
}

async function reviewPayload(client: ServiceClient, userId: string, attemptId: string) {
  const attempt = await ownedAttempt(client, userId, attemptId)
  if (attempt.status !== 'submitted') throw new HttpError(409, 'review_unavailable')
  const { data, error } = await client.from('attempt_items').select(`
    ordinal, part, responses(choice_id),
    question_versions!inner(prompt, translations(locale, explanation, prompt_translation, transcript), choices(id, label, content, is_correct, position))
  `).eq('attempt_id', attemptId).order('ordinal')
  if (error) throw error
  return {
    attemptId, status: 'submitted', locale: attempt.locale,
    items: (data ?? []).map((raw) => {
      const item = raw as unknown as { ordinal: number; part: number; responses: Array<{ choice_id: string | null }>;
        question_versions: { prompt: unknown; translations: Array<{ locale: 'th' | 'en'; explanation: string; prompt_translation: string | null; transcript: string | null }>;
          choices: Array<{ id: string; label: string; content: unknown; is_correct: boolean; position: number }> } }
      const translations = Object.fromEntries(item.question_versions.translations.map((translation) => [translation.locale, translation]))
      const preferred = translations[attempt.locale] ?? translations.en ?? translations.th
      return {
        ordinal: item.ordinal, part: item.part, prompt: item.question_versions.prompt,
        selectedChoiceId: item.responses[0]?.choice_id ?? null,
        correctChoiceId: item.question_versions.choices.find((choice) => choice.is_correct)?.id,
        choices: [...item.question_versions.choices].sort((a, b) => a.position - b.position).map(({ id, label, content }) => ({ id, label, content })),
        explanation: Object.fromEntries(Object.entries(translations).map(([locale, translation]) => [locale, translation.explanation])),
        promptTranslation: preferred?.prompt_translation ?? null,
        transcript: item.part <= 4 ? preferred?.transcript ?? null : null,
      }
    }),
  }
}

async function historyPayload(client: ServiceClient, userId: string) {
  const { data, error } = await client.from('score_results').select(`
    attempt_id, listening_scaled, reading_scaled, total_scaled,
    attempts!inner(mode, timing_unverified, submitted_at, user_id)
  `).eq('attempts.user_id', userId).order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((raw) => {
    const row = raw as unknown as { attempt_id: string; listening_scaled: number | null; reading_scaled: number | null; total_scaled: number | null;
      attempts: { mode: 'full' | 'quick' | 'practice'; timing_unverified: boolean; submitted_at: string } }
    return { attemptId: row.attempt_id, mode: row.attempts.mode, timingUnverified: row.attempts.timing_unverified,
      submittedAt: row.attempts.submitted_at, total: row.attempts.mode === 'full' ? row.total_scaled : null,
      listening: row.listening_scaled, reading: row.reading_scaled }
  })
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  try {
    const user = await requireUser(request)
    const body = await request.json() as { action?: string; attemptId?: string }
    const client = createServiceClient()
    let payload: Record<string, unknown>
    if (body.action === 'history') payload = { history: await historyPayload(client, user.id) }
    else {
      if (!body.attemptId) throw new HttpError(400, 'invalid_request')
      if (body.action === 'submit' || !body.action) {
        const { error } = await client.rpc('submit_attempt', { p_user_id: user.id, p_attempt_id: body.attemptId, p_scoring_version: 'sq-v1' })
        if (error?.code === '42501') throw new HttpError(404, 'attempt_not_found')
        if (error) throw error
      }
      if (body.action === 'review') payload = { review: await reviewPayload(client, user.id, body.attemptId) }
      else if (body.action === 'result') payload = { result: await resultPayload(client, user.id, body.attemptId) }
      else payload = { result: await resultPayload(client, user.id, body.attemptId), review: await reviewPayload(client, user.id, body.attemptId) }
    }
    return new Response(JSON.stringify(payload), { status: 200, headers })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const code = error instanceof HttpError ? error.code : 'internal_error'
    console.error(error)
    return new Response(JSON.stringify({ code }), { status, headers })
  }
})
