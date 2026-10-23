import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAdminRepository } from './adminRepository'

export type PoolCoverage = { part: number; draft: number; review: number; publishedQuestions: number; completeGroups: number }
const loadCoverageFromCloud = () => getAdminRepository().listCoverage()
export function DashboardPage({ loadCoverage = loadCoverageFromCloud }: { loadCoverage?: () => Promise<PoolCoverage[]> }) {
  const { t } = useTranslation()
  const [coverage, setCoverage] = useState<PoolCoverage[]>([]); const [error, setError] = useState('')
  useEffect(() => { void loadCoverage().then(setCoverage).catch(() => setError(t('admin.loadError'))) }, [loadCoverage, t])
  const fullEquivalent = coverage.length === 7 ? Math.min(...coverage.map((row) => row.completeGroups)) : 0
  const published = coverage.reduce((sum, item) => sum + item.publishedQuestions, 0); const review = coverage.reduce((sum, item) => sum + item.review, 0); const draft = coverage.reduce((sum, item) => sum + item.draft, 0)
  return <main className="admin-page"><header className="admin-heading"><div><h1>{t('admin.dashboard')}</h1><p>{t('admin.dashboardHint')}</p></div><Link className="button button-primary" to="/admin/generate"><Plus aria-hidden="true" size={18} />{t('admin.generate')}</Link></header>
    {error && <p role="alert">{error}</p>}<section className="admin-stats"><article><span>{t('admin.published')}</span><strong>{published}</strong></article><article><span>{t('admin.review')}</span><strong>{review}</strong></article><article><span>{t('admin.draft')}</span><strong>{draft}</strong></article><article><span>{t('admin.fullReady')}</span><strong>{fullEquivalent}</strong></article></section>
    <section className="admin-card"><h2>{t('admin.coverage')}</h2><div className="coverage-grid">{coverage.map((row) => <article key={row.part}><strong>Part {row.part}</strong><span>{t('admin.publishedCount', { count: row.publishedQuestions })}</span><span>{t('admin.completeCount', { count: row.completeGroups })}</span></article>)}</div></section>
  </main>
}
