import { useTranslation } from 'react-i18next'

export type PoolCoverage = { part: number; draft: number; review: number; publishedQuestions: number; completeGroups: number }
export function DashboardPage({ coverage = [] }: { coverage?: PoolCoverage[] }) {
  const { t } = useTranslation()
  const fullEquivalent = coverage.length === 7 ? Math.min(...coverage.map((row) => row.completeGroups)) : 0
  return <main className="admin-page"><h1>{t('admin.dashboard')}</h1><p>{t('admin.fullEquivalent', { count: fullEquivalent })}</p>
    <div className="admin-grid">{coverage.map((row) => <article className="admin-card" key={row.part}><h2>Part {row.part}</h2><p>{t('admin.published')}: {row.publishedQuestions}</p><p>{t('admin.completeGroups')}: {row.completeGroups}</p></article>)}</div>
  </main>
}
