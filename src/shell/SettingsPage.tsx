import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { getBrowserClient } from '../shared/supabase/browser'
import { Button } from '../shared/ui/Button'
import { LanguageSwitch } from '../shared/ui/LanguageSwitch'

export function SettingsPage({ saveTarget }: { saveTarget?: (score: number) => Promise<void> }) {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const [target, setTarget] = useState(profile?.target_score ?? 750)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setStatus('')
    if (target < 10 || target > 990 || target % 5 !== 0) {
      setStatus(t('settings.invalidTarget'))
      return
    }
    setSaving(true)
    try {
      if (saveTarget) await saveTarget(target)
      else if (user) {
        const { error } = await getBrowserClient().from('profiles').update({ target_score: target }).eq('id', user.id)
        if (error) throw error
      }
      setStatus(t('settings.saved'))
    } catch {
      setStatus(t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page settings-page">
      <header className="page-heading"><div><p className="eyebrow">SCORE QUEST</p><h1>{t('settings.title')}</h1><p className="muted">{t('settings.subtitle')}</p></div></header>
      <div className="settings-layout">
        <aside className="profile-card"><span className="profile-avatar profile-avatar-large">{(profile?.display_name || user?.email || 'S').slice(0, 1).toUpperCase()}</span><h2>{profile?.display_name || t('nav.learner')}</h2><p>{user?.email}</p><Button onClick={() => void signOut()}>{t('auth.signOut')}</Button></aside>
        <section className="settings-card">
          <div className="setting-row"><div><h2>{t('settings.language')}</h2><p>{t('settings.languageDetail')}</p></div><LanguageSwitch /></div>
          <div className="setting-row"><div><h2>{t('settings.target')}</h2><p>{t('settings.targetDetail')}</p></div><label className="target-field"><span>{t('settings.targetLabel')}</span><input type="number" min="10" max="990" step="5" value={target} onChange={(event) => setTarget(Number(event.target.value))} /></label></div>
          <div className="setting-row"><div><h2>{t('settings.install')}</h2><p>{t('settings.installDetail')}</p></div><span className="setting-badge">PWA</span></div>
          <div className="settings-actions"><Button onClick={() => void save()} disabled={saving}>{saving ? t('settings.saving') : t('settings.save')}</Button>{status && <span role="status">{status}</span>}</div>
        </section>
      </div>
    </main>
  )
}
