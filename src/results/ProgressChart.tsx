import { useTranslation } from 'react-i18next'
import type { HistoryEntry } from './resultsRepository'

export function ProgressChart({ entries }: { entries: HistoryEntry[] }) {
  const { t } = useTranslation()
  const verified = entries.filter((entry) => entry.mode === 'full' && !entry.timingUnverified && entry.total !== null)
  const points = verified.map((entry, index) => {
    const x = verified.length === 1 ? 150 : 20 + index * (260 / (verified.length - 1))
    const y = 110 - (((entry.total ?? 10) - 10) / 980) * 90
    return `${x},${y}`
  }).join(' ')
  return (
    <section className="progress-chart">
      <svg viewBox="0 0 300 130" role="img" aria-label={t('results.progress')}>
        <line x1="20" y1="110" x2="280" y2="110" stroke="currentColor" opacity=".2" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" />
        {points.split(' ').filter(Boolean).map((point, index) => {
          const [cx, cy] = point.split(',')
          return <circle key={verified[index].attemptId} cx={cx} cy={cy} r="5" fill="currentColor" />
        })}
      </svg>
      <table>
        <caption>{t('results.progressTable')}</caption>
        <thead><tr><th>{t('results.date')}</th><th>{t('results.estimatedScore')}</th></tr></thead>
        <tbody>{verified.map((entry) => <tr key={entry.attemptId}><td>{new Date(entry.submittedAt).toLocaleDateString()}</td><td>{entry.total}</td></tr>)}</tbody>
      </table>
    </section>
  )
}
