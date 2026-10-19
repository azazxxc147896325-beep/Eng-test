import { useTranslation } from 'react-i18next'
import { Button } from '../shared/ui/Button'

const modes = [
  { key: 'full', icon: '◷' },
  { key: 'quick', icon: '⚡' },
  { key: 'part', icon: '◎' },
] as const

export function ModeSelectPage() {
  const { t } = useTranslation()
  return (
    <main className="page">
      <header className="mode-header"><p className="eyebrow">SCORE QUEST</p><h1>{t('modes.title')}</h1><p className="muted">{t('modes.subtitle')}</p></header>
      <div className="mode-grid">
        {modes.map(({ key, icon }) => (
          <section className="mode-card" key={key}>
            <span className="mode-icon" aria-hidden="true">{icon}</span>
            <h2>{t(`modes.${key}`)}</h2>
            <p>{t(`modes.${key}Detail`)}</p>
            <Button>{t('modes.start')}</Button>
          </section>
        ))}
      </div>
    </main>
  )
}
