import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { getBrowserClient } from '../../shared/supabase/browser'
import type { AttemptRepository, AttemptSnapshot } from '../data/AttemptRepository'
import { SupabaseAttemptRepository } from '../data/SupabaseAttemptRepository'
import { SupabaseResponseRepository } from '../data/SupabaseResponseRepository'
import { OfflineResponseQueue } from '../session/offlineQueue'
import { createAttemptStore } from '../session/useAttemptStore'
import { ExamLayout } from './ExamLayout'
import { SupabaseResultsRepository, type ResultsRepository } from '../../results/resultsRepository'
import './exam.css'

type QueuePort = Pick<OfflineResponseQueue, 'queueResponse'> & Partial<Pick<OfflineResponseQueue, 'flushResponses'>>

function ReadyExam({ snapshot, queue, attemptRepository, resultsRepository, onSnapshot }: {
  snapshot: AttemptSnapshot
  queue: QueuePort
  attemptRepository?: AttemptRepository
  resultsRepository?: ResultsRepository
  onSnapshot: (snapshot: AttemptSnapshot) => void
}) {
  const store = useMemo(() => createAttemptStore(snapshot, queue), [snapshot, queue])
  const navigate = useNavigate()
  useEffect(() => {
    const syncQueuedResponses = () => { void queue.flushResponses?.() }
    syncQueuedResponses()
    window.addEventListener('online', syncQueuedResponses)
    return () => window.removeEventListener('online', syncQueuedResponses)
  }, [queue])
  return <ExamLayout
    store={store}
    onTransition={attemptRepository ? async () => {
      const transitioned = await attemptRepository.transition(snapshot.id)
      onSnapshot(transitioned)
      return transitioned
    } : undefined}
    onComplete={async () => {
      await (resultsRepository ?? new SupabaseResultsRepository(getBrowserClient())).submit(snapshot.id)
      navigate(`/results/${snapshot.id}`, { replace: true })
    }}
  />
}

export function ExamPage({ snapshot: suppliedSnapshot, queue: suppliedQueue, repository: suppliedRepository, resultsRepository: suppliedResultsRepository }: {
  snapshot?: AttemptSnapshot
  queue?: QueuePort
  repository?: AttemptRepository
  resultsRepository?: ResultsRepository
}) {
  const { t } = useTranslation()
  const { attemptId = '' } = useParams()
  const [snapshot, setSnapshot] = useState<AttemptSnapshot | null>(suppliedSnapshot ?? null)
  const [error, setError] = useState('')
  const dependencies = useMemo(() => {
    if (suppliedSnapshot && suppliedQueue) return { queue: suppliedQueue, repository: suppliedRepository }
    const client = getBrowserClient()
    return {
      repository: suppliedRepository ?? new SupabaseAttemptRepository(client),
      queue: suppliedQueue ?? new OfflineResponseQueue(new SupabaseResponseRepository(client)),
    }
  }, [suppliedQueue, suppliedRepository, suppliedSnapshot])

  useEffect(() => {
    if (suppliedSnapshot) return
    void dependencies.repository?.resume(attemptId).then(setSnapshot).catch(() => setError(t('exam.loadError')))
  }, [attemptId, dependencies.repository, suppliedSnapshot, t])

  if (error) return <main className="exam-status" role="alert">{error}</main>
  if (!snapshot) return <main className="exam-status">{t('exam.loading')}</main>
  return <ReadyExam snapshot={snapshot} queue={dependencies.queue} attemptRepository={dependencies.repository}
    resultsRepository={suppliedResultsRepository} onSnapshot={setSnapshot} />
}
