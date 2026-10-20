import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ScoreResult } from '../exam/domain/scoring'
import { getBrowserClient } from '../shared/supabase/browser'
import { PartBreakdown } from './PartBreakdown'
import { ScoreSummary } from './ScoreSummary'
import { SupabaseResultsRepository, type ResultsRepository } from './resultsRepository'

export function ResultsPage({ result: supplied, repository: suppliedRepository }: { result?: ScoreResult; repository?: ResultsRepository }) {
  const { t } = useTranslation()
  const { attemptId = '' } = useParams()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [result, setResult] = useState<ScoreResult | null>(supplied ?? null)
  useEffect(() => { if (!supplied) void repository?.getResult(attemptId).then(setResult) }, [attemptId, repository, supplied])
  if (!result) return <main className="page">{t('results.loading')}</main>
  return <main className="page results-page"><ScoreSummary result={result} /><PartBreakdown result={result} /></main>
}
