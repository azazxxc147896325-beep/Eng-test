import { useTranslation } from 'react-i18next'
import type { ScoreResult } from '../exam/domain/scoring'

export function PartBreakdown({ result }: { result: ScoreResult }) {
  const { t } = useTranslation()
  return (
    <section className="part-breakdown">
      <h2>{t('results.byPart')}</h2>
      <div className="part-result-grid">{result.parts.map((part) => (
        <article key={part.part} className={result.weakParts.includes(part.part) ? 'weak' : ''}>
          <b>Part {part.part}</b><strong>{part.accuracy}%</strong><small>{part.correct}/{part.total}</small>
        </article>
      ))}</div>
      {result.weakParts.length > 0 && <p>{t('results.focus', { parts: result.weakParts.join(', ') })}</p>}
    </section>
  )
}
