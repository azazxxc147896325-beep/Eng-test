import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getBrowserClient } from '../shared/supabase/browser'
import { ProgressChart } from './ProgressChart'
import { SupabaseResultsRepository, type HistoryEntry, type ResultsRepository } from './resultsRepository'
import { TrendingUp } from 'lucide-react'
import { LoadErrorState } from './LoadErrorState'

export function HistoryPage({ history: supplied, repository: suppliedRepository }: { history?: HistoryEntry[]; repository?: ResultsRepository }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [history, setHistory] = useState(supplied ?? [])
  const [loading, setLoading] = useState(supplied === undefined)
  const [error, setError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  useEffect(() => {
    if (supplied) return
    setLoading(true); setError('')
    void repository?.listHistory().then(setHistory).catch(() => setError(t('results.loadError'))).finally(() => setLoading(false))
  }, [loadVersion, repository, supplied, t])
  const verified = history.filter((entry) => entry.mode === 'full' && !entry.timingUnverified && entry.total !== null) as Array<HistoryEntry & { total: number }>
  const previous = verified.at(-2)?.total
  const latest = verified.at(-1)?.total
  const change = latest !== undefined && previous !== undefined ? latest - previous : null
  return <main className="page history-page"><header className="history-heading"><div><p className="eyebrow">SCORE QUEST</p><h1>{t('results.history')}</h1><p className="muted">{t('results.historyDetail')}</p></div>{change !== null && <p className="score-change">{change >= 0 ? '+' : ''}{change} {t('results.points')}</p>}</header>
    {error ? <LoadErrorState message={error} onRetry={() => setLoadVersion((value) => value + 1)} /> : loading ? <p role="status">{t('results.loading')}</p> : history.length === 0 ? <section className="history-empty"><span aria-hidden="true"><TrendingUp /></span><h2>{t('results.noHistory')}</h2><p>{t('results.noHistoryDetail')}</p><button onClick={() => navigate('/play')}>{t('results.startPractice')}</button></section> : <ProgressChart entries={history} />}
  </main>
}
