import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'
import { Button } from '../shared/ui/Button'
import { ArrowRight, BarChart3, Check, Headphones, Lightbulb, Sparkles } from 'lucide-react'

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="brand" href="#top" aria-label="Score Quest">
          <span className="brand-logo" aria-hidden="true">SQ</span>
          <span>Score Quest</span>
        </a>
        <div className="landing-nav-actions">
          <LanguageSwitch />
          <Button onClick={() => navigate('/login')}>{t('landing.start')}</Button>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-copy">
          <p className="landing-kicker"><Sparkles aria-hidden="true" size={16} />{t('landing.kicker')}</p>
          <h1>{t('landing.title')} <span>{t('landing.titleAccent')}</span></h1>
          <p className="landing-lead">{t('landing.lead')}</p>
          <Button size="large" onClick={() => navigate('/login')}>{t('landing.free')}<ArrowRight aria-hidden="true" size={19} /></Button>
          <ul className="landing-trust" aria-label={t('landing.benefits')}>
            <li><Check aria-hidden="true" size={16} />{t('landing.noCard')}</li>
            <li><Check aria-hidden="true" size={16} />{t('landing.devices')}</li>
            <li><Check aria-hidden="true" size={16} />{t('landing.reviewAfter')}</li>
          </ul>
        </div>
        <div className="landing-demo" aria-label={t('landing.preview')}>
          <div className="demo-top"><span>{t('landing.sampleResult')}</span><b>735</b></div>
          <div className="demo-progress"><span style={{ width: '74%' }} /></div>
          <div className="demo-split"><span>Listening <b>385</b></span><span>Reading <b>350</b></span></div>
          <div className="demo-focus"><Lightbulb aria-hidden="true" /><div><b>{t('landing.focus')}</b><small>{t('landing.focusDetail')}</small></div></div>
        </div>
      </section>

      <section className="landing-features" aria-label={t('landing.benefits')}>
        {(['real', 'weak', 'progress'] as const).map((key, index) => {
          const Icon = [Headphones, Lightbulb, BarChart3][index]
          return <article key={key}><span className="feature-icon"><Icon aria-hidden="true" size={20} /></span><h2>{t(`landing.${key}`)}</h2><p>{t(`landing.${key}Detail`)}</p></article>
        })}
      </section>
    </main>
  )
}
