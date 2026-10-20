import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '../../shared/supabase/database.types'
import type { AttemptRepository, AttemptSnapshot, CreateAttemptInput } from './AttemptRepository'

const jsonSchema: z.ZodType<unknown> = z.unknown()
const snapshotSchema = z.object({
  id: z.string(),
  mode: z.enum(['full', 'quick', 'practice']),
  status: z.enum(['in_progress', 'section_complete', 'submitted', 'expired', 'abandoned']),
  locale: z.enum(['th', 'en']),
  seed: z.string(),
  currentSection: z.enum(['listening', 'reading', 'practice']),
  startedAt: z.string(),
  sectionExpiresAt: z.string().nullable(),
  items: z.array(z.object({
    ordinal: z.number().int().positive(),
    section: z.enum(['listening', 'reading', 'practice']),
    part: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]),
    groupId: z.string().nullable(),
    questionVersionId: z.string(),
    prompt: jsonSchema,
    media: z.array(z.object({ id: z.string(), kind: z.enum(['image', 'audio']), storagePath: z.string(), metadata: jsonSchema })),
    choices: z.array(z.object({ id: z.string(), label: z.string(), content: jsonSchema })),
    choiceOrder: z.array(z.string()),
    choiceShuffleAllowed: z.boolean(),
  })),
})

export class InsufficientQuestionPoolError extends Error {
  constructor() {
    super('Insufficient question pool')
    this.name = 'InsufficientQuestionPoolError'
  }
}

export class ExistingAttemptError extends Error {
  constructor() {
    super('An attempt is already in progress')
    this.name = 'ExistingAttemptError'
  }
}

async function throwMappedError(error: unknown): Promise<never> {
  const response = (error as { context?: Response })?.context
  if (response?.status === 409) {
    const body = await response.clone().json().catch(() => ({})) as { code?: string }
    if (body.code === 'insufficient_pool') throw new InsufficientQuestionPoolError()
    if (body.code === 'existing_attempt') throw new ExistingAttemptError()
  }
  throw error
}

export class SupabaseAttemptRepository implements AttemptRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(input: CreateAttemptInput): Promise<AttemptSnapshot> {
    const { data, error } = await this.client.functions.invoke('create-attempt', {
      body: { action: 'create', ...input },
    })
    if (error) return throwMappedError(error)
    return snapshotSchema.parse(data) as AttemptSnapshot
  }

  async resume(attemptId: string): Promise<AttemptSnapshot> {
    const { data, error } = await this.client.functions.invoke('create-attempt', {
      body: { action: 'resume', attemptId },
    })
    if (error) return throwMappedError(error)
    return snapshotSchema.parse(data) as AttemptSnapshot
  }
}
