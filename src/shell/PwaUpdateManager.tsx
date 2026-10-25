import { useRegisterSW } from 'virtual:pwa-register/react'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'

export function PwaUpdateManager() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <PwaUpdatePrompt
      needRefresh={needRefresh}
      onUpdate={() => void updateServiceWorker(true)}
      onDismiss={() => setNeedRefresh(false)}
    />
  )
}
