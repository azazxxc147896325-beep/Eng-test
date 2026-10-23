import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/Button'
import { ProgressBar } from '../shared/ui/ProgressBar'
import { getBrowserClient } from '../shared/supabase/browser'
import { SupabaseResultsRepository, type HistoryEntry, type ResultsRepository } from '../results/resultsRepository'
import { ArrowRight, Play, Plus } from 'lucide-react'

export function HomePage({ history: suppliedHistory, repository: suppliedRepository }: { history?: HistoryEntry[]; repository?: ResultsRepository }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const repository = useMemo(() => suppliedRepository ?? (suppliedHistory ? null : new SupabaseResultsRepository(getBrowserClient())), [suppliedHistory, suppliedRepository])
  const [history, setHistory] = useState<HistoryEntry[]>(suppliedHistory ?? [])
  const [loading, setLoading] = useState(suppliedHistory === undefined)
  useEffect(() => {
    if (suppliedHistory) return
    void repository?.listHistory().then(setHistory).catch(() => setHistory([])).finally(() => setLoading(false))
  }, [repository, suppliedHistory])

  const verified = history.filter((entry) => entry.mode === 'full' && !entry.timingUnverified && entry.total !== null)
  const latest = verified.at(-1)
  const previous = verified.at(-2)
  const change = latest?.total != null && previous?.total != null ? latest.total - previous.total : null
  const progress = latest?.total ? Math.round((latest.total / 990) * 100) : 0

  return (
    <main className="page learner-home">
      <header className="home-heading"><div><p className="eyebrow">{t('home.eyebrow')}</p><h1>{t('home.welcome')}</h1><p className="muted">{t('home.welcomeDetail')}</p></div><Button onClick={() => navigate('/play')}><Plus aria-hidden="true" size={18} />{t('home.newPractice')}</Button></header>
      <div className="dashboard-grid">
        <section className="dashboard-main">
          <article className="daily-mission">
            <div><span className="mission-label">{t('home.mission')}</span><h2>{t('home.missionTitle')}</h2><p>{t('home.missionDetail')}</p><div className="mission-meta"><span>10 {t('exam.questions')}</span><span>≈ 8 min</span></div></div>
            <Button size="large" onClick={() => navigate('/play')}><Play aria-hidden="true" size={18} />{t('home.play')}</Button>
          </article>
          <section className="part-shortcuts"><div className="section-title"><h2>{t('home.practiceByPart')}</h2><button onClick={() => navigate('/play')}>{t('home.viewAll')}</button></div><div className="part-shortcut-grid">{[5, 6, 7].map((part) => <button key={part} onClick={() => navigate('/play')}><b>Part {part}</b><span>{t(`home.part${part}`)}</span><i aria-hidden="true"><ArrowRight size={17} /></i></button>)}</div></section>
        </section>
        <aside className="dashboard-side">
          <section className="score-panel">
            <span>{t('home.latestScore')}</span>
            <strong>{loading ? '…' : latest?.total ?? '—'}</strong>
            <small>{t('home.estimated')}</small>
            {change !== null && <p className={change >= 0 ? 'score-up' : 'score-down'}>{change >= 0 ? '+' : ''}{change} {t('results.points')}</p>}
            {!loading && !latest && <p className="muted empty-score">{t('home.noScore')}</p>}
            <div className="goal-row"><span>{t('home.goal', { score: 800 })}</span><b>{progress}%</b></div>
            <ProgressBar value={progress} label={t('home.goal', { score: 800 })} />
          </section>
          <section className="recent-panel"><div className="section-title"><h2>{t('home.recent')}</h2><button onClick={() => navigate('/history')}>{t('home.viewAll')}</button></div>{history.length === 0 ? <p className="muted">{t('home.noHistory')}</p> : history.slice(-3).reverse().map((entry) => <button className="recent-row" key={entry.attemptId} onClick={() => navigate(`/results/${entry.attemptId}`)}><span><b>{t(`home.mode.${entry.mode}`)}</b><small>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(entry.submittedAt))}</small></span><strong>{entry.total ?? '—'}</strong></button>)}</section>
        </aside>
      </div>
    </main>
  )
}
