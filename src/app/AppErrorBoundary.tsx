import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { i18n } from '../i18n'

type Props = { children: ReactNode; onRetry?: () => void }
type State = { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('app_render_error', error, info.componentStack)
  }

  private retry = () => {
    if (this.props.onRetry) this.props.onRetry()
    else window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children

    return <main className="fatal-error-page">
      <span className="fatal-error-icon" aria-hidden="true"><TriangleAlert /></span>
      <h1>{i18n.t('stability.errorTitle')}</h1>
      <p>{i18n.t('stability.errorDetail')}</p>
      <button type="button" onClick={this.retry}><RefreshCw aria-hidden="true" size={18} />{i18n.t('stability.tryAgain')}</button>
    </main>
  }
}
