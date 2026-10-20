import { useTranslation } from 'react-i18next'
import type { ContentRepository, EditorDraft } from './contentRepository'

export function QuestionEditorPage({ draft, currentUserId, roles, repository }: {
  draft: EditorDraft; currentUserId: string; roles: string[]; repository: ContentRepository
}) {
  const { t } = useTranslation()
  const own = draft.createdBy === currentUserId
  const staff = roles.includes('reviewer') || roles.includes('admin')
  return <main className="admin-page"><p className="eyebrow">Part {draft.part}</p><h1>{t('admin.editor')}</h1>
    <section className="admin-card"><h2>{draft.prompt}</h2><p>{t('admin.status')}: {draft.status}</p>
      <div className="admin-actions">
        {own && draft.status === 'draft' && <button onClick={() => void repository.saveDraft(draft)}>{t('admin.saveDraft')}</button>}
        {own && ['draft', 'checks_passed'].includes(draft.status) && <button onClick={() => void repository.submitForReview(draft.id)}>{t('admin.submitReview')}</button>}
        {!own && staff && draft.status === 'in_review' && <button onClick={() => void repository.approve(draft.id)}>{t('admin.approve')}</button>}
        {roles.includes('admin') && draft.status === 'approved' && <button onClick={() => void repository.publish(draft.id)}>{t('admin.publish')}</button>}
        {roles.includes('admin') && draft.status === 'published' && <button onClick={() => void repository.retire(draft.id)}>{t('admin.retire')}</button>}
      </div>
    </section>
  </main>
}
