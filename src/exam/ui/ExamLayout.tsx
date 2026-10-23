import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AttemptStore } from '../session/useAttemptStore'
import { useAttemptStore } from '../session/useAttemptStore'
import { AnswerNavigator } from './AnswerNavigator'
import { ExamFooter } from './ExamFooter'
import { QuestionRenderer } from './QuestionRenderer'
import { createServerClock } from '../session/clock'

export function ExamLayout({ store, onComplete }: { store: AttemptStore; onComplete: () => Promise<void> }) {
  const { t } = useTranslation()
  const state = useAttemptStore(store)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [listeningUnlocked, setListeningUnlocked] = useState(true)
  const [, setTick] = useState(0)
  const navigatorButton = useRef<HTMLButtonElement>(null)
  const clock = useMemo(() => createServerClock(state.snapshot.serverNow), [state.snapshot.serverNow])
  const item = state.snapshot.items[state.currentItemIndex]
  const response = state.responses[item.attemptItemId]
  const previous = state.snapshot.items[state.currentItemIndex - 1]
  const next = state.snapshot.items[state.currentItemIndex + 1]
  const nextSectionItem = state.snapshot.items.find((candidate) => candidate.ordinal > item.ordinal && candidate.section !== state.currentSection)
  const isLastQuestion = state.currentItemIndex === state.snapshot.items.length - 1
  const isSectionEnd = !next && Boolean(nextSectionItem)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState('')
  const nextAudio = next?.media.find((asset) => asset.kind === 'audio')
  const remaining = state.sectionExpiresAt ? clock.remainingMs(state.sectionExpiresAt) : null
  const timeLabel = remaining === null
    ? t('exam.practice')
    : `${String(Math.floor(remaining / 60_000)).padStart(2, '0')}:${String(Math.floor(remaining / 1_000) % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!state.sectionExpiresAt) return
    const timer = window.setInterval(() => setTick((value) => value + 1), 1_000)
    return () => window.clearInterval(timer)
  }, [state.sectionExpiresAt])

  useEffect(() => {
    const hasAudio = item.media.some((asset) => asset.kind === 'audio')
    if (state.snapshot.mode === 'practice' || !hasAudio) setListeningUnlocked(true)
  }, [item.attemptItemId, item.media, state.snapshot.mode])

  function closeNavigator() {
    setNavigatorOpen(false)
    requestAnimationFrame(() => navigatorButton.current?.focus())
  }

  async function advance() {
    if (next?.section === state.currentSection) {
      store.next()
      return
    }
    if (isSectionEnd && nextSectionItem) {
      const minutes = state.snapshot.mode === 'full' ? 75 : 18
      store.transitionSection(nextSectionItem.section, new Date(clock.now().getTime() + minutes * 60_000).toISOString())
      return
    }
    if (isLastQuestion) {
      setFinishing(true)
      setFinishError('')
      try { await onComplete() } catch { setFinishError(t('exam.submitError')); setFinishing(false) }
    }
  }

  return (
    <main className="exam-page">
      <header className="exam-header">
        <strong><span>SCORE</span> QUEST</strong>
        <div><b>Part {item.part}</b><small>{t('exam.questionOf', { current: item.ordinal, total: state.snapshot.items.length })}</small></div>
        <div className="exam-header-actions">
          <span className="timer" aria-label={state.sectionExpiresAt ? t('exam.timed') : t('exam.practice')}>{timeLabel}</span>
          <button ref={navigatorButton} className="navigator-trigger" type="button" onClick={() => setNavigatorOpen(true)}>{t('exam.questions')}</button>
        </div>
      </header>
      <div className="exam-body">
        <section className="exam-content">
          <QuestionRenderer
            item={item}
            mode={state.snapshot.mode}
            attemptId={state.snapshot.id}
            nextAudio={nextAudio}
            selectedId={response?.choiceId ?? null}
            onSelect={(id) => void store.answer(id)}
            onListeningStateChange={(listening) => setListeningUnlocked(listening.nextUnlocked)}
          />
        </section>
        <AnswerNavigator
          items={state.snapshot.items}
          currentIndex={state.currentItemIndex}
          responses={state.responses}
          onSelect={(index) => {
            if (state.snapshot.items[index]?.section !== state.currentSection) return
            while (store.getState().currentItemIndex < index) store.next()
            while (store.getState().currentItemIndex > index) store.previous()
          }}
          mobileOpen={navigatorOpen}
          onClose={closeNavigator}
        />
      </div>
      {finishError && <p className="exam-submit-error" role="alert">{finishError}</p>}
      <ExamFooter
        canPrevious={previous?.section === state.currentSection}
        canNext={!finishing && listeningUnlocked && (next?.section === state.currentSection || isSectionEnd || isLastQuestion)}
        nextLabel={finishing ? t('exam.submitting') : isLastQuestion ? t('exam.submit') : isSectionEnd ? t('exam.startReading') : undefined}
        marked={response?.marked ?? false}
        onPrevious={store.previous}
        onNext={() => void advance()}
        onMark={() => void store.toggleMark()}
      />
    </main>
  )
}
