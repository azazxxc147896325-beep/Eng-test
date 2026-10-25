import { RefreshCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PwaUpdatePrompt({ needRefresh, onUpdate, onDismiss }: {
  needRefresh: boolean
  onUpdate: () => void
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  if (!needRefresh) return null

  return (
    <aside className="pwa-update-prompt" role="status">
      <span className="pwa-update-icon" aria-hidden="true"><RefreshCw /></span>
      <div><strong>{t('stability.updateAvailable')}</strong><small>{t('stability.updateDetail')}</small></div>
      <button className="pwa-update-action" type="button" onClick={onUpdate}>{t('stability.updateNow')}</button>
      <button className="pwa-update-dismiss" type="button" onClick={onDismiss} aria-label={t('stability.later')}><X aria-hidden="true" /></button>
    </aside>
  )
}
