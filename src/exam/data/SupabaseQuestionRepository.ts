import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '../../shared/supabase/database.types'
import type { CandidateGroup, ExamMedia, JsonValue, Part } from '../domain/types'
import type { EligibleQuestionFilters, QuestionRepository } from './QuestionRepository'

const partSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)])
const difficultySchema = z.enum(['easy', 'medium', 'hard'])
const mediaSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['image', 'audio']),
  storage_path: z.string(),
  metadata: z.unknown(),
})
const rowSchema = z.object({
  id: z.string().uuid(),
  prompt: z.unknown(),
  difficulty: difficultySchema,
  choice_shuffle_allowed: z.boolean(),
  group_id: z.string().uuid().nullable(),
  questions: z.object({ part: partSchema }),
  question_groups: z.object({
    id: z.string().uuid(),
    part: partSchema,
    group_type: z.string(),
    difficulty: difficultySchema,
    media: z.array(mediaSchema),
  }).nullable(),
  choices: z.array(z.object({
    id: z.string().uuid(),
    label: z.string(),
    content: z.unknown(),
    position: z.number(),
  })),
  media: z.array(mediaSchema),
})

function mapMedia(items: z.infer<typeof mediaSchema>[]): ExamMedia[] {
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    storagePath: item.storage_path,
    metadata: item.metadata as JsonValue,
  }))
}

export class SupabaseQuestionRepository implements QuestionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listEligible(filters: EligibleQuestionFilters): Promise<CandidateGroup[]> {
    let query = this.client
      .from('question_versions')
      .select(`
        id, prompt, difficulty, choice_shuffle_allowed, group_id,
        questions!inner(part),
        question_groups(id, part, group_type, difficulty, media(id, kind, storage_path, metadata)),
        choices(id, label, content, position),
        media(id, kind, storage_path, metadata)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 2000)

    if (filters.parts?.length) query = query.in('questions.part', [...filters.parts])
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)

    const { data, error } = await query
    if (error) throw error
    const rows = z.array(rowSchema).parse(data)
    const groups = new Map<string, CandidateGroup>()

    for (const row of rows) {
      const groupId = row.group_id ?? `question:${row.id}`
      const group = groups.get(groupId) ?? {
        id: groupId,
        part: (row.question_groups?.part ?? row.questions.part) as Part,
        groupType: row.question_groups?.group_type ?? 'single',
        difficulty: row.question_groups?.difficulty ?? row.difficulty,
        media: mapMedia(row.question_groups?.media ?? []),
        questions: [],
      }
      group.questions.push({
        questionVersionId: row.id,
        prompt: row.prompt as JsonValue,
        choiceShuffleAllowed: row.choice_shuffle_allowed,
        media: mapMedia(row.media),
        choices: [...row.choices].sort((left, right) => left.position - right.position).map((choice) => ({
          id: choice.id,
          label: choice.label,
          content: choice.content as JsonValue,
        })),
      })
      groups.set(groupId, group)
    }

    return [...groups.values()]
  }
}
