import { RefreshCw, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LoadErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return <section className="load-error-state" role="alert">
    <span aria-hidden="true"><WifiOff /></span>
    <p>{message}</p>
    <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true" size={17} />{t('stability.retry')}</button>
  </section>
}
