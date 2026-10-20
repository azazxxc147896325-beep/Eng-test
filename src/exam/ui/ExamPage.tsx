import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { getBrowserClient } from '../../shared/supabase/browser'
import type { AttemptRepository, AttemptSnapshot } from '../data/AttemptRepository'
import { SupabaseAttemptRepository } from '../data/SupabaseAttemptRepository'
import { SupabaseResponseRepository } from '../data/SupabaseResponseRepository'
import { OfflineResponseQueue } from '../session/offlineQueue'
import { createAttemptStore } from '../session/useAttemptStore'
import { ExamLayout } from './ExamLayout'
import './exam.css'

type QueuePort = Pick<OfflineResponseQueue, 'queueResponse'>

function ReadyExam({ snapshot, queue }: { snapshot: AttemptSnapshot; queue: QueuePort }) {
  const store = useMemo(() => createAttemptStore(snapshot, queue), [snapshot, queue])
  return <ExamLayout store={store} />
}

export function ExamPage({ snapshot: suppliedSnapshot, queue: suppliedQueue, repository: suppliedRepository }: {
  snapshot?: AttemptSnapshot
  queue?: QueuePort
  repository?: AttemptRepository
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
  return <ReadyExam snapshot={snapshot} queue={dependencies.queue} />
}
