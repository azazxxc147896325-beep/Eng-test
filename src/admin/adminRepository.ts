import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../shared/supabase/database.types'
import { getBrowserClient } from '../shared/supabase/browser'
import type { EditorChoice, EditorTranslation } from './contentRepository'

export type ContentStatus = Database['public']['Enums']['content_status']
export type AppRole = Database['public']['Enums']['app_role']
export type QuestionListItem = { id: string; part: number; prompt: string; promptData?: Json; difficulty: string; status: ContentStatus; createdAt: string; createdBy: string; choices?: EditorChoice[]; translations?: { th: EditorTranslation; en: EditorTranslation } }
export type CoverageItem = { part: number; draft: number; review: number; publishedQuestions: number; completeGroups: number }
export type AdminUser = { id: string; displayName: string; createdAt: string; roles: AppRole[] }
type RawQuestion = {
  id: string; prompt: Json; difficulty: string; status: ContentStatus; created_at: string; created_by: string
  questions: { part?: number } | null
  choices?: { id: string; label: string; content: Json; is_correct: boolean; position: number }[]
  translations?: { locale: string; prompt_translation: string | null; explanation: string; transcript: string | null }[]
}

function textOf(value: Json) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.text === 'string') return value.text
  return JSON.stringify(value)
}
function questionOf(row: RawQuestion): QuestionListItem {
  const translations = row.translations ? Object.fromEntries(['th', 'en'].map((locale) => {
    const item = row.translations?.find((translation) => translation.locale === locale)
    return [locale, { promptTranslation: item?.prompt_translation ?? '', explanation: item?.explanation ?? '', transcript: item?.transcript ?? undefined }]
  })) as { th: EditorTranslation; en: EditorTranslation } : undefined
  return {
    id: row.id, part: Number(row.questions?.part ?? 0), prompt: textOf(row.prompt), promptData: row.prompt,
    difficulty: row.difficulty, status: row.status, createdAt: row.created_at, createdBy: row.created_by,
    choices: row.choices?.sort((a, b) => a.position - b.position).map((choice) => ({ id: choice.id, label: choice.label, text: textOf(choice.content), correct: choice.is_correct })),
    translations,
  }
}

export class AdminRepository {
  constructor(private readonly client: SupabaseClient<Database> = getBrowserClient()) {}

  async listQuestions(status?: ContentStatus): Promise<QuestionListItem[]> {
    let query = this.client.from('question_versions').select('id,prompt,difficulty,status,created_at,created_by,questions(part)').order('created_at', { ascending: false }).limit(200)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => questionOf(row as RawQuestion))
  }

  async getQuestion(id: string): Promise<QuestionListItem | null> {
    const { data, error } = await this.client.from('question_versions').select('id,prompt,difficulty,status,created_at,created_by,questions(part),choices(id,label,content,is_correct,position),translations(locale,prompt_translation,explanation,transcript)').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? questionOf(data as RawQuestion) : null
  }

  async listCoverage(): Promise<CoverageItem[]> {
    const { data, error } = await this.client.from('content_pool_coverage').select('*').order('part')
    if (error) throw error
    return (data ?? []).map((row) => ({ part: row.part ?? 0, draft: row.draft_groups ?? 0, review: row.review_groups ?? 0, publishedQuestions: row.published_questions ?? 0, completeGroups: row.complete_groups ?? 0 }))
  }

  async listUsers(): Promise<AdminUser[]> {
    const [profiles, roles] = await Promise.all([
      this.client.from('profiles').select('id,display_name,created_at').order('created_at', { ascending: false }).limit(200),
      this.client.from('user_roles').select('user_id,role').limit(600),
    ])
    if (profiles.error) throw profiles.error
    if (roles.error) throw roles.error
    return (profiles.data ?? []).map((profile) => ({ id: profile.id, displayName: profile.display_name ?? '—', createdAt: profile.created_at, roles: (roles.data ?? []).filter((item) => item.user_id === profile.id).map((item) => item.role) }))
  }

  async setUserRole(userId: string, role: AppRole) {
    const { error } = await this.client.rpc('set_user_staff_role', { p_role: role, p_user_id: userId })
    if (error) throw error
  }
}

export function getAdminRepository() { return new AdminRepository() }
