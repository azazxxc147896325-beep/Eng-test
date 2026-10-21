import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getBrowserClient } from '../shared/supabase/browser'
import { getAdminRepository, type QuestionListItem } from './adminRepository'
import { SupabaseContentRepository } from './contentRepository'
import { QuestionEditorPage } from './QuestionEditorPage'
import { useTranslation } from 'react-i18next'

export function QuestionEditorRoutePage() {
  const { t } = useTranslation()
  const { questionVersionId = '' } = useParams(); const { user, roles } = useAuth(); const [item, setItem] = useState<QuestionListItem | null>(null); const [error, setError] = useState('')
  useEffect(() => { void getAdminRepository().getQuestion(questionVersionId).then((found) => { if (found) setItem(found); else setError(t('admin.notFound')) }).catch(() => setError(t('admin.loadError'))) }, [questionVersionId, t])
  if (error) return <main className="admin-page"><p role="alert">{error}</p></main>
  if (!item || !user) return <main className="admin-page" role="status">{t('admin.loading')}</main>
  return <QuestionEditorPage draft={{ id: item.id, createdBy: item.createdBy, status: item.status, part: item.part, prompt: item.prompt, promptData: item.promptData, choices: item.choices, translations: item.translations }} currentUserId={user.id} roles={roles} repository={new SupabaseContentRepository(getBrowserClient())} />
}
