import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ScoreResult } from '../exam/domain/scoring'
import { getBrowserClient } from '../shared/supabase/browser'
import { PartBreakdown } from './PartBreakdown'
import { ScoreSummary } from './ScoreSummary'
import { SupabaseResultsRepository, type ResultsRepository } from './resultsRepository'

export function ResultsPage({ result: supplied, repository: suppliedRepository, attemptId: suppliedAttemptId }: { result?: ScoreResult; repository?: ResultsRepository; attemptId?: string }) {
  const { t } = useTranslation()
  const { attemptId: routeAttemptId = '' } = useParams()
  const attemptId = suppliedAttemptId ?? routeAttemptId
  const navigate = useNavigate()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [result, setResult] = useState<ScoreResult | null>(supplied ?? null)
  useEffect(() => { if (!supplied) void repository?.getResult(attemptId).then(setResult) }, [attemptId, repository, supplied])
  if (!result) return <main className="page">{t('results.loading')}</main>
  return <main className="page result-view">
    <header className="result-heading"><div><p className="eyebrow">SCORE QUEST</p><h1>{t('results.complete')}</h1><p className="muted">{t('results.completeDetail')}</p></div><div className="result-actions"><button onClick={() => navigate(`/results/${attemptId}/review`)}>{t('results.openReview')}</button><button onClick={() => navigate('/play')}>{t('results.practiceAgain')}</button></div></header>
    <div className="results-page"><ScoreSummary result={result} /><PartBreakdown result={result} /></div>
  </main>
}
