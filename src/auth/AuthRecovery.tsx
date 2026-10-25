import { RefreshCw, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AuthRecovery({ retry }: { retry: () => Promise<void> }) {
  const { t } = useTranslation()
  return <main className="auth-status auth-recovery" role="alert">
    <span aria-hidden="true"><WifiOff /></span>
    <h1>{t('auth.connectionError')}</h1>
    <p>{t('auth.connectionErrorDetail')}</p>
    <button type="button" onClick={() => void retry()}><RefreshCw aria-hidden="true" size={18} />{t('stability.retry')}</button>
  </main>
}
