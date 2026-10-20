import { useTranslation } from 'react-i18next'
import type { AttemptSnapshot } from '../data/AttemptRepository'
import type { ResponseMutation } from '../data/ResponseRepository'

function Buttons({ items, currentIndex, responses, onSelect }: {
  items: AttemptSnapshot['items']; currentIndex: number; responses: Record<string, ResponseMutation>; onSelect: (index: number) => void
}) {
  return <div className="navigator-grid">{items.map((item, index) => (
    <button
      type="button"
      key={item.attemptItemId}
      className={index === currentIndex ? 'current' : responses[item.attemptItemId] ? 'answered' : ''}
      aria-current={index === currentIndex ? 'step' : undefined}
      onClick={() => onSelect(index)}
    >{item.ordinal}</button>
  ))}</div>
}

export function AnswerNavigator({ items, currentIndex, responses, onSelect, mobileOpen, onClose }: {
  items: AttemptSnapshot['items']; currentIndex: number; responses: Record<string, ResponseMutation>
  onSelect: (index: number) => void; mobileOpen: boolean; onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <aside className="answer-navigator desktop-navigator" aria-label={t('exam.questions')}>
        <h2>{t('exam.questions')}</h2>
        <Buttons {...{ items, currentIndex, responses, onSelect }} />
      </aside>
      <dialog className="answer-drawer" open={mobileOpen} aria-modal="true" aria-label={t('exam.questions')}>
        <div className="drawer-heading"><h2>{t('exam.questions')}</h2><button type="button" onClick={onClose} aria-label={t('exam.close')}>×</button></div>
        <Buttons items={items} currentIndex={currentIndex} responses={responses} onSelect={(index) => { onSelect(index); onClose() }} />
      </dialog>
    </>
  )
}
