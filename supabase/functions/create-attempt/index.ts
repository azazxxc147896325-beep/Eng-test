import { createServiceClient, HttpError, requireUser } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7
type Mode = 'full' | 'quick' | 'practice'
type Candidate = {
  id: string; part: Part; groupId: string | null; questions: Question[]
}
type Question = {
  id: string; prompt: unknown; choiceShuffleAllowed: boolean
  choices: Array<{ id: string; label: string; content: unknown; position?: number }>
  media: Array<{ id: string; kind: 'image' | 'audio'; storage_path: string; metadata: unknown; status?: string }>
}

const BLUEPRINTS: Record<'full' | 'quick', Array<[Part, number]>> = {
  full: [[1, 6], [2, 25], [3, 39], [4, 30], [5, 30], [6, 16], [7, 54]],
  quick: [[1, 1], [2, 6], [3, 9], [4, 9], [5, 8], [6, 4], [7, 13]],
}

function randomFromSeed(seed: string) {
  let state = 2166136261
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

function shuffle<T>(source: readonly T[], random: () => number) {
  const items = [...source]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function exactGroups(groups: Candidate[], target: number): Candidate[] | null {
  const failed = new Set<string>()
  function visit(index: number, remaining: number): Candidate[] | null {
    if (remaining === 0) return []
    if (remaining < 0 || index === groups.length) return null
    const key = `${index}:${remaining}`
    if (failed.has(key)) return null
    const included = visit(index + 1, remaining - groups[index].questions.length)
    if (included) return [groups[index], ...included]
    const excluded = visit(index + 1, remaining)
    if (excluded) return excluded
    failed.add(key)
    return null
  }
  return visit(0, target)
}

function blueprintFor(body: Record<string, unknown>): Array<[Part, number]> {
  if (body.mode === 'full' || body.mode === 'quick') return BLUEPRINTS[body.mode]
  const part = Number(body.part) as Part
  const count = Number(body.questionCount)
  if (![1, 2, 3, 4, 5, 6, 7].includes(part) || ![10, 20, 30].includes(count)) {
    throw new HttpError(400, 'invalid_practice_blueprint')
  }
  return [[part, count]]
}

async function readSnapshot(client: ReturnType<typeof createServiceClient>, userId: string, attemptId: string) {
  const { data: attempt, error: attemptError } = await client.from('attempts')
    .select('id, mode, status, locale, seed, current_section, started_at, section_expires_at')
    .eq('id', attemptId).eq('user_id', userId).single()
  if (attemptError || !attempt) throw new HttpError(404, 'attempt_not_found')

  const { data: items, error: itemError } = await client.from('attempt_items').select(`
    id, ordinal, section, part, group_id, question_version_id, choice_order,
    question_versions!inner(prompt, choice_shuffle_allowed,
      choices(id, label, content), media(id, kind, storage_path, metadata, status))
  `).eq('attempt_id', attemptId).order('ordinal')
  if (itemError) throw itemError

  const { data: responses, error: responseError } = await client.from('responses')
    .select('attempt_item_id, choice_id, marked, answered_at')
    .eq('attempt_id', attemptId).eq('user_id', userId)
  if (responseError) throw responseError
  const itemById = new Map((items ?? []).map((item) => [item.id, item]))

  const groupIds = [...new Set((items ?? []).map((item) => item.group_id).filter(Boolean))]
  const { data: groupMedia } = groupIds.length
    ? await client.from('media').select('id, group_id, kind, storage_path, metadata, status')
      .in('group_id', groupIds).eq('status', 'published')
    : { data: [] }

  return {
    id: attempt.id, mode: attempt.mode, status: attempt.status, locale: attempt.locale, seed: attempt.seed,
    currentSection: attempt.current_section, serverNow: new Date().toISOString(),
    startedAt: attempt.started_at, sectionExpiresAt: attempt.section_expires_at,
    responses: (responses ?? []).flatMap((response) => {
      const item = itemById.get(response.attempt_item_id)
      return item ? [{
        attemptId: attempt.id, attemptItemId: response.attempt_item_id,
        questionVersionId: item.question_version_id, choiceId: response.choice_id,
        marked: response.marked, answeredAt: response.answered_at,
      }] : []
    }),
    items: (items ?? []).map((item) => {
      const version = item.question_versions as unknown as Question & { choice_shuffle_allowed: boolean }
      const choiceOrder = item.choice_order as string[]
      const choices = [...(version.choices ?? [])].sort((left, right) =>
        choiceOrder.indexOf(left.id) - choiceOrder.indexOf(right.id))
      const media = [...(version.media ?? []).filter((asset) => asset.status === 'published'),
        ...(groupMedia ?? []).filter((asset) => asset.group_id === item.group_id)]
      return {
        attemptItemId: item.id, ordinal: item.ordinal, section: item.section, part: item.part, groupId: item.group_id,
        questionVersionId: item.question_version_id, prompt: version.prompt,
        choiceShuffleAllowed: version.choice_shuffle_allowed, choiceOrder, choices,
        media: media.map((asset) => ({ id: asset.id, kind: asset.kind, storagePath: asset.storage_path, metadata: asset.metadata })),
      }
    }),
  }
}

async function createAttempt(client: ReturnType<typeof createServiceClient>, userId: string, body: Record<string, unknown>) {
  const mode = body.mode as Mode
  if (!['full', 'quick', 'practice'].includes(mode) || !['th', 'en'].includes(String(body.locale))) {
    throw new HttpError(400, 'invalid_request')
  }
  const idempotencyKey = String(body.idempotencyKey ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new HttpError(400, 'invalid_idempotency_key')
  }

  const { data: replay } = await client.from('attempts').select('id')
    .eq('user_id', userId).eq('idempotency_key', idempotencyKey).maybeSingle()
  if (replay) return readSnapshot(client, userId, replay.id)

  const { data: active } = await client.from('attempts').select('id')
    .eq('user_id', userId).in('status', ['in_progress', 'section_complete']).maybeSingle()
  if (active) throw new HttpError(409, 'existing_attempt')

  const blueprint = blueprintFor(body)
  const parts = blueprint.map(([part]) => part)
  const { data: recentAttempts } = await client.from('attempts').select('id')
    .eq('user_id', userId).order('started_at', { ascending: false }).limit(10)
  const recentAttemptIds = (recentAttempts ?? []).map((attempt) => attempt.id)
  const { data: recentItems } = recentAttemptIds.length
    ? await client.from('attempt_items').select('group_id, question_version_id').in('attempt_id', recentAttemptIds)
    : { data: [] }
  const recentGroups = new Set((recentItems ?? []).map((item) => item.group_id).filter(Boolean))
  const recentQuestions = new Set((recentItems ?? []).map((item) => item.question_version_id))
  let query = client.from('question_versions').select(`
    id, prompt, choice_shuffle_allowed, group_id, difficulty,
    questions!inner(part), choices(id, label, content, position), media(id, kind, storage_path, metadata, status)
  `).eq('status', 'published').in('questions.part', parts).limit(5000)
  if (mode === 'practice' && body.difficulty) query = query.eq('difficulty', String(body.difficulty))
  const { data: rows, error } = await query
  if (error) throw error

  const groups = new Map<string, Candidate>()
  for (const raw of rows ?? []) {
    const row = raw as unknown as { id: string; prompt: unknown; choice_shuffle_allowed: boolean; group_id: string | null;
      questions: { part: Part }; choices: Question['choices']; media: Question['media'] }
    if (recentQuestions.has(row.id) || (row.group_id && recentGroups.has(row.group_id))) continue
    const key = row.group_id ?? `question:${row.id}`
    const group = groups.get(key) ?? { id: key, part: row.questions.part, groupId: row.group_id, questions: [] }
    group.questions.push({ id: row.id, prompt: row.prompt, choiceShuffleAllowed: row.choice_shuffle_allowed,
      choices: [...row.choices].sort((left, right) => (left.position ?? 0) - (right.position ?? 0)),
      media: row.media.filter((asset) => asset.status === 'published') })
    groups.set(key, group)
  }

  const seed = crypto.randomUUID()
  const random = randomFromSeed(seed)
  const selected = blueprint.flatMap(([part, count]) => {
    const match = exactGroups(shuffle([...groups.values()].filter((group) => group.part === part), random), count)
    if (!match) throw new HttpError(409, 'insufficient_pool')
    return match
  })
  let ordinal = 0
  const items = selected.flatMap((group) => group.questions.map((question) => {
    ordinal += 1
    const choices = question.choiceShuffleAllowed ? shuffle(question.choices, random) : question.choices
    return { ordinal, section: mode === 'practice' ? 'practice' : group.part <= 4 ? 'listening' : 'reading',
      part: group.part, group_id: group.groupId, question_version_id: question.id,
      choice_order: choices.map((choice) => choice.id) }
  }))
  const firstSection = mode === 'practice' ? 'practice' : 'listening'
  const duration = mode === 'full' ? 45 : mode === 'quick' ? 12 : null
  const { data: attemptId, error: rpcError } = await client.rpc('create_attempt_snapshot', {
    p_user_id: userId, p_idempotency_key: idempotencyKey, p_mode: mode, p_locale: body.locale,
    p_seed: seed, p_current_section: firstSection, p_section_duration_minutes: duration,
    p_blueprint_id: null, p_items: items,
  })
  if (rpcError?.code === '23505') throw new HttpError(409, 'existing_attempt')
  if (rpcError) throw rpcError
  return readSnapshot(client, userId, attemptId as string)
}

async function transitionAttempt(client: ReturnType<typeof createServiceClient>, userId: string, attemptId: string) {
  const { error } = await client.rpc('transition_attempt_section', {
    p_user_id: userId,
    p_attempt_id: attemptId,
  })
  if (error?.code === '42501') throw new HttpError(404, 'attempt_not_found')
  if (error?.code === '22023') throw new HttpError(409, 'invalid_section_transition')
  if (error) throw error
  return readSnapshot(client, userId, attemptId)
}

Deno.serve(async (request) => {
  const headers = corsHeaders(request)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  try {
    const user = await requireUser(request)
    const body = await request.json() as Record<string, unknown>
    const client = createServiceClient()
    const payload = body.action === 'resume'
      ? await readSnapshot(client, user.id, String(body.attemptId ?? ''))
      : body.action === 'transition'
        ? await transitionAttempt(client, user.id, String(body.attemptId ?? ''))
        : await createAttempt(client, user.id, body)
    return new Response(JSON.stringify(payload), { status: 200, headers })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const code = error instanceof HttpError ? error.code : 'internal_error'
    console.error(error)
    return new Response(JSON.stringify({ code }), { status, headers })
  }
})
