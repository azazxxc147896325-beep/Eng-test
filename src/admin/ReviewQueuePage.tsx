import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { getAdminRepository, type QuestionListItem } from './adminRepository'
import { SupabaseContentRepository } from './contentRepository'
import { getBrowserClient } from '../shared/supabase/browser'

const loadReviewQuestions = () => getAdminRepository().listQuestions('in_review')
export function ReviewQueuePage({ loadQuestions = loadReviewQuestions }: { loadQuestions?: () => Promise<QuestionListItem[]> }) {
  const { t } = useTranslation()
  const { user } = useAuth(); const [questions, setQuestions] = useState<QuestionListItem[]>([]); const [selected, setSelected] = useState<QuestionListItem | null>(null); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); void loadQuestions().then((rows) => { setQuestions(rows); setSelected(rows[0] ?? null) }).catch(() => setMessage(t('admin.loadError'))).finally(() => setLoading(false)) }, [loadQuestions, t])
  async function approve() { if (!selected) return; try { await new SupabaseContentRepository(getBrowserClient()).approve(selected.id); setQuestions((rows) => rows.filter((row) => row.id !== selected.id)); setSelected(null); setMessage(t('admin.approved')) } catch { setMessage(t('admin.approveError')) } }
  return <main className="admin-page"><header className="admin-heading"><div><h1>{t('admin.reviewQueue')}</h1><p>{t('admin.reviewHint')}</p></div><span className="status status-in_review">{t('admin.waitingCount', { count: questions.length })}</span></header>{message && <p role="status">{message}</p>}
    {loading ? <section className="admin-card admin-empty" role="status">{t('admin.loading')}</section> : <div className="review-layout"><section className="review-list">{questions.map((item) => <button className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelected(item)} key={item.id}><strong>Part {item.part} · {item.difficulty}</strong><span>{item.prompt}</span></button>)}</section>{selected ? <section className="admin-card review-detail"><span className="status status-in_review">{t('admin.review')}</span><h2>Part {selected.part} · {selected.difficulty}</h2><p className="review-prompt">{selected.prompt}</p><div className="admin-actions"><Link className="button" to={`/admin/questions/${selected.id}`}>{t('admin.openEditor')}</Link><button disabled={selected.createdBy === user?.id} onClick={() => void approve()}>{t('admin.approve')}</button></div>{selected.createdBy === user?.id && <p className="admin-note">{t('admin.ownApproval')}</p>}</section> : <section className="admin-card admin-empty">{t('admin.emptyQueue')}</section>}</div>}
  </main>
}
