import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { getBrowserClient } from '../shared/supabase/browser'
import { ReviewQuestion } from './ReviewQuestion'
import { ReviewUnavailableError, SupabaseResultsRepository, type AttemptReview, type ResultsRepository } from './resultsRepository'

export function ReviewPage({ review: supplied, repository: suppliedRepository }: { review?: AttemptReview; repository?: ResultsRepository }) {
  const { t } = useTranslation()
  const { attemptId = '' } = useParams()
  const repository = useMemo(() => suppliedRepository ?? (supplied ? null : new SupabaseResultsRepository(getBrowserClient())), [supplied, suppliedRepository])
  const [review, setReview] = useState<AttemptReview | null>(supplied ?? null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (supplied) return
    void repository?.getReview(attemptId).then(setReview).catch((reason) =>
      setError(reason instanceof ReviewUnavailableError ? t('results.reviewUnavailable') : t('results.loadError')))
  }, [attemptId, repository, supplied, t])
  if (error) return <main className="page" role="alert">{error}</main>
  if (!review) return <main className="page">{t('results.loading')}</main>
  return <main className="page review-page"><h1>{t('results.review')}</h1>{review.items.map((item) => <ReviewQuestion key={item.ordinal} item={item} />)}</main>
}
