import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBrowserClient } from '../shared/supabase/browser'
import { ProgressChart } from './ProgressChart'
import { SupabaseResultsRepository, type HistoryEntry, type ResultsRepository } from './resultsRepository'

export function HistoryPage({ history: supplied, repository: suppliedRepository }: { history?: HistoryEntry[]; repository?: ResultsRepository }) {
  const { t } = useTranslation()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [history, setHistory] = useState(supplied ?? [])
  useEffect(() => { if (!supplied) void repository?.listHistory().then(setHistory) }, [repository, supplied])
  const verified = history.filter((entry) => entry.mode === 'full' && !entry.timingUnverified && entry.total !== null) as Array<HistoryEntry & { total: number }>
  const previous = verified.at(-2)?.total
  const latest = verified.at(-1)?.total
  const change = latest !== undefined && previous !== undefined ? latest - previous : null
  return <main className="page history-page"><h1>{t('results.history')}</h1>
    {change !== null && <p className="score-change">{change >= 0 ? '+' : ''}{change} {t('results.points')}</p>}
    <ProgressChart entries={history} />
  </main>
}
