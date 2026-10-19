import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/Button'
import { ProgressBar } from '../shared/ui/ProgressBar'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <main className="page">
      <div className="home-grid">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t('home.eyebrow')}</p>
            <h1>{t('home.title')}</h1>
            <div className="score-row">
              <div><div className="score-value">735</div><span className="muted">{t('home.estimated')}</span></div>
              <div><strong>{t('home.goal', { score: 800 })}</strong><ProgressBar value={73} label={t('home.goal', { score: 800 })} /></div>
            </div>
            <Button size="large" onClick={() => navigate('/play')}>▶ {t('home.play')}</Button>
          </div>
        </section>
        <aside className="mission-card">
          <p className="eyebrow">{t('home.mission')}</p>
          <h2>{t('home.missionTitle')}</h2>
          <p className="muted">{t('home.missionDetail')}</p>
          <div className="reward-row"><span className="pill">+120 XP</span><span className="pill time">8 min</span></div>
        </aside>
      </div>
    </main>
  )
}
