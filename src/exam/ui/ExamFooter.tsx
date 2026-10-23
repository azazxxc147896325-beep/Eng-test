import { useTranslation } from 'react-i18next'

export function ExamFooter({ canPrevious, canNext, marked, nextLabel, onPrevious, onNext, onMark }: {
  canPrevious: boolean; canNext: boolean; marked: boolean
  nextLabel?: string
  onPrevious: () => void; onNext: () => void; onMark: () => void
}) {
  const { t } = useTranslation()
  return (
    <footer className="exam-footer">
      <button type="button" onClick={onPrevious} disabled={!canPrevious}>← {t('exam.previous')}</button>
      <button type="button" className={marked ? 'marked' : ''} onClick={onMark}>⚑ {t('exam.mark')}</button>
      <button type="button" className="next-button" onClick={onNext} disabled={!canNext}>{nextLabel ?? t('exam.next')} →</button>
    </footer>
  )
}
