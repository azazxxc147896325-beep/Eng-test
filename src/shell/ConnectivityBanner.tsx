import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ConnectionState = 'online' | 'offline' | 'restored'

export function ConnectivityBanner({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation()
  const [connection, setConnection] = useState<ConnectionState>(() => navigator.onLine ? 'online' : 'offline')
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearRestoreTimer = () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current)
      restoreTimer.current = null
    }
    const offline = () => { clearRestoreTimer(); setConnection('offline') }
    const online = () => {
      clearRestoreTimer()
      setConnection('restored')
      restoreTimer.current = setTimeout(() => setConnection('online'), 4_000)
    }
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      clearRestoreTimer()
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])

  if (connection === 'online') return null
  if (connection === 'restored') return <div className="connectivity-banner restored" role="status"><Wifi aria-hidden="true" size={18} />{t('stability.backOnline')}</div>

  return <div className="connectivity-banner offline" role="alert">
    <span><WifiOff aria-hidden="true" size={18} />{t('stability.offline')}</span>
    <button type="button" onClick={onRetry ?? (() => window.location.reload())}><RefreshCw aria-hidden="true" size={16} />{t('stability.retry')}</button>
  </div>
}
