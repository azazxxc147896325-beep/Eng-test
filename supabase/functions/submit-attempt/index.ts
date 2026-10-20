import { createServiceClient, HttpError, requireUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (request) => {
  const headers = corsHeaders(request)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  try {
    const user = await requireUser(request)
    const body = await request.json() as { attemptId?: string }
    if (!body.attemptId) throw new HttpError(400, 'invalid_request')
    const client = createServiceClient()
    const { data: resultId, error: submitError } = await client.rpc('submit_attempt', {
      p_user_id: user.id, p_attempt_id: body.attemptId, p_scoring_version: 'sq-v1',
    })
    if (submitError?.code === '42501') throw new HttpError(404, 'attempt_not_found')
    if (submitError) throw submitError

    const { data: score, error: scoreError } = await client.from('score_results').select('*')
      .eq('id', resultId).eq('user_id', user.id).single()
    if (scoreError) throw scoreError
    const { data: attempt } = await client.from('attempts').select('mode, locale').eq('id', body.attemptId).single()
    const { data: review, error: reviewError } = await client.from('attempt_items').select(`
      id, ordinal, part, question_version_id,
      responses(choice_id),
      question_versions!inner(solution, translations(locale, explanation, prompt_translation, transcript), choices(id, is_correct))
    `).eq('attempt_id', body.attemptId).order('ordinal')
    if (reviewError) throw reviewError

    return new Response(JSON.stringify({ score, mode: attempt?.mode, locale: attempt?.locale, review }), { status: 200, headers })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const code = error instanceof HttpError ? error.code : 'internal_error'
    console.error(error)
    return new Response(JSON.stringify({ code }), { status, headers })
  }
})
