import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Part } from '../exam/domain/types'
import type { AttemptRepository, CreateAttemptInput } from '../exam/data/AttemptRepository'
import { ExistingAttemptError, InsufficientQuestionPoolError, SupabaseAttemptRepository } from '../exam/data/SupabaseAttemptRepository'
import { getBrowserClient } from '../shared/supabase/browser'
import { Button } from '../shared/ui/Button'

function requestKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ModeSelectPage({ repository: suppliedRepository }: { repository?: AttemptRepository }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const repository = useMemo(() => suppliedRepository ?? new SupabaseAttemptRepository(getBrowserClient()), [suppliedRepository])
  const [part, setPart] = useState<Part>(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30>(10)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'th'

  async function start(input: Omit<CreateAttemptInput, 'locale' | 'idempotencyKey'>) {
    setError('')
    setStarting(input.mode)
    try {
      const attempt = await repository.create({ ...input, locale, idempotencyKey: requestKey() })
      navigate(`/attempt/${attempt.id}`)
    } catch (reason) {
      if (reason instanceof InsufficientQuestionPoolError) setError(t('modes.insufficient'))
      else if (reason instanceof ExistingAttemptError) setError(t('modes.existing'))
      else setError(t('modes.startError'))
    } finally {
      setStarting(null)
    }
  }

  return (
    <main className="page mode-page">
      <header className="page-heading"><div><p className="eyebrow">SCORE QUEST</p><h1>{t('modes.title')}</h1><p className="muted">{t('modes.subtitle')}</p></div></header>
      {error && <p className="mode-error" role="alert">{error}</p>}
      <div className="mode-feature-grid">
        <section className="mode-choice mode-choice-featured">
          <span className="mode-badge">{t('modes.realBadge')}</span><span className="mode-choice-icon" aria-hidden="true">◷</span>
          <h2>{t('modes.full')}</h2><p>{t('modes.fullDetail')}</p>
          <div className="mode-facts"><span>Listening · 45 min</span><span>Reading · 75 min</span></div>
          <Button size="large" onClick={() => void start({ mode: 'full' })} disabled={starting !== null}>{starting === 'full' ? t('modes.starting') : t('modes.startFull')}</Button>
        </section>
        <section className="mode-choice">
          <span className="mode-badge mode-badge-quick">{t('modes.quickBadge')}</span><span className="mode-choice-icon" aria-hidden="true">⚡</span>
          <h2>{t('modes.quick')}</h2><p>{t('modes.quickDetail')}</p>
          <div className="mode-facts"><span>50 {t('exam.questions')}</span><span>≈ 30 min</span></div>
          <Button size="large" onClick={() => void start({ mode: 'quick' })} disabled={starting !== null}>{starting === 'quick' ? t('modes.starting') : t('modes.startQuick')}</Button>
        </section>
      </div>
      <section className="practice-builder">
        <div className="practice-copy"><span className="mode-choice-icon" aria-hidden="true">◎</span><div><h2>{t('modes.part')}</h2><p>{t('modes.partDetail')}</p></div></div>
        <div className="practice-controls">
          <label>Part<select value={part} onChange={(event) => setPart(Number(event.target.value) as Part)}>{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>Part {value}</option>)}</select></label>
          <label>{t('modes.difficulty')}<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option value="easy">{t('modes.easy')}</option><option value="medium">{t('modes.medium')}</option><option value="hard">{t('modes.hard')}</option></select></label>
          <label>{t('modes.questionCount')}<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value) as typeof questionCount)}><option value="10">10</option><option value="20">20</option><option value="30">30</option></select></label>
          <Button onClick={() => void start({ mode: 'practice', part, difficulty, questionCount })} disabled={starting !== null}>{starting === 'practice' ? t('modes.starting') : t('modes.startPart')}</Button>
        </div>
      </section>
    </main>
  )
}
