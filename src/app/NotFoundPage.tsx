import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="not-found-page">
      <div className="not-found-top"><span className="brand-logo" aria-hidden="true">SQ</span><LanguageSwitch /></div>
      <section>
        <span className="not-found-icon" aria-hidden="true"><Compass /></span>
        <p className="eyebrow">404</p>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.detail')}</p>
        <Link className="button button-primary" to="/home">{t('notFound.backHome')}</Link>
      </section>
    </main>
  )
}
