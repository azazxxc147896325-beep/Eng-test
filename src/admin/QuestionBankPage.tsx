import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ContentStatus, QuestionListItem } from './adminRepository'
import { getAdminRepository } from './adminRepository'

const loadQuestionsFromCloud = () => getAdminRepository().listQuestions()

export function QuestionBankPage({ loadQuestions = loadQuestionsFromCloud }: { loadQuestions?: () => Promise<QuestionListItem[]> }) {
  const { t } = useTranslation()
  const [questions, setQuestions] = useState<QuestionListItem[]>([]); const [query, setQuery] = useState(''); const [part, setPart] = useState(0); const [status, setStatus] = useState<ContentStatus | ''>(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); void loadQuestions().then(setQuestions).catch(() => setError(t('admin.loadError'))).finally(() => setLoading(false)) }, [loadQuestions, t])
  const rows = useMemo(() => questions.filter((item) => (!query || item.prompt.toLowerCase().includes(query.toLowerCase()) || item.id.includes(query)) && (!part || item.part === part) && (!status || item.status === status)), [questions, query, part, status])
  return <main className="admin-page"><header className="admin-heading"><div><h1>{t('admin.bank')}</h1><p>{t('admin.bankHint')}</p></div><Link className="button button-primary" to="/admin/generate">＋ {t('admin.addQuestion')}</Link></header>
    <section className="admin-stats"><article><span>{t('admin.all')}</span><strong>{questions.length}</strong></article><article><span>{t('admin.published')}</span><strong>{questions.filter((q) => q.status === 'published').length}</strong></article><article><span>{t('admin.review')}</span><strong>{questions.filter((q) => q.status === 'in_review').length}</strong></article><article><span>{t('admin.draft')}</span><strong>{questions.filter((q) => q.status === 'draft').length}</strong></article></section>
    <section className="admin-card admin-table-card"><div className="admin-filters"><input type="search" placeholder={t('admin.search')} value={query} onChange={(e) => setQuery(e.target.value)} /><select aria-label="Part" value={part} onChange={(e) => setPart(Number(e.target.value))}><option value="0">{t('admin.allParts')}</option>{[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>Part {n}</option>)}</select><select aria-label={t('admin.status')} value={status} onChange={(e) => setStatus(e.target.value as ContentStatus | '')}><option value="">{t('admin.allStatuses')}</option><option value="published">Published</option><option value="in_review">Review</option><option value="draft">Draft</option></select></div>
      {error && <p role="alert">{error}</p>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>ID</th><th>Part</th><th>{t('admin.question')}</th><th>{t('admin.difficulty')}</th><th>{t('admin.status')}</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{item.id.slice(0, 8)}</td><td>{item.part}</td><td>{item.prompt}</td><td>{item.difficulty}</td><td><span className={`status status-${item.status}`}>{item.status}</span></td><td><Link to={`/admin/questions/${item.id}`}>{t('admin.edit')}</Link></td></tr>)}</tbody></table></div>
      {loading && <p className="admin-empty" role="status">{t('admin.loading')}</p>}
      {!loading && !error && rows.length === 0 && <p className="admin-empty">{t('admin.noQuestions')}</p>}
    </section>
  </main>
}
