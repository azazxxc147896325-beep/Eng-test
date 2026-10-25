import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ScoreResult } from '../exam/domain/scoring'
import { getBrowserClient } from '../shared/supabase/browser'
import { PartBreakdown } from './PartBreakdown'
import { ScoreSummary } from './ScoreSummary'
import { SupabaseResultsRepository, type ResultsRepository } from './resultsRepository'
import { LoadErrorState } from './LoadErrorState'

export function ResultsPage({ result: supplied, repository: suppliedRepository, attemptId: suppliedAttemptId }: { result?: ScoreResult; repository?: ResultsRepository; attemptId?: string }) {
  const { t } = useTranslation()
  const { attemptId: routeAttemptId = '' } = useParams()
  const attemptId = suppliedAttemptId ?? routeAttemptId
  const navigate = useNavigate()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [result, setResult] = useState<ScoreResult | null>(supplied ?? null)
  const [error, setError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)
  useEffect(() => {
    if (supplied) return
    setError('')
    void repository?.getResult(attemptId).then(setResult).catch(() => setError(t('results.loadError')))
  }, [attemptId, loadVersion, repository, supplied, t])
  if (error) return <main className="page"><LoadErrorState message={error} onRetry={() => setLoadVersion((value) => value + 1)} /></main>
  if (!result) return <main className="page">{t('results.loading')}</main>
  return <main className="page result-view">
    <header className="result-heading"><div><p className="eyebrow">SCORE QUEST</p><h1>{t('results.complete')}</h1><p className="muted">{t('results.completeDetail')}</p></div><div className="result-actions"><button onClick={() => navigate(`/results/${attemptId}/review`)}>{t('results.openReview')}</button><button onClick={() => navigate('/play')}>{t('results.practiceAgain')}</button></div></header>
    <div className="results-page"><ScoreSummary result={result} /><PartBreakdown result={result} /></div>
  </main>
}
