import { useTranslation } from 'react-i18next'
import type { ScoreResult } from '../exam/domain/scoring'

export function ScoreSummary({ result }: { result: ScoreResult }) {
  const { t } = useTranslation()
  return (
    <section className="score-summary">
      <p className="eyebrow">{result.mode === 'full' ? t('results.estimatedScore') : result.mode === 'quick' ? t('results.quickEstimate') : t('results.practiceAccuracy')}</p>
      {result.mode === 'full' && <strong className="result-total">{result.total}</strong>}
      {result.mode === 'quick' && <strong className="result-range">{result.range?.min}–{result.range?.max}</strong>}
      {result.mode === 'practice' && <strong className="result-total">{result.accuracy}%</strong>}
      {result.mode !== 'practice' && <div className="section-scores">
        <span>{t('results.listening')} <b>{result.section.listening}</b></span>
        <span>{t('results.reading')} <b>{result.section.reading}</b></span>
      </div>}
      <p className="muted">{t('results.disclaimer')}</p>
    </section>
  )
}
