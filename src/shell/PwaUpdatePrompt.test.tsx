import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'
import '../i18n'

afterEach(cleanup)

describe('PwaUpdatePrompt', () => {
  it('lets the user choose when a new version reloads the app', () => {
    const update = vi.fn()
    render(<PwaUpdatePrompt needRefresh onUpdate={update} onDismiss={() => undefined} />)

    fireEvent.click(screen.getByRole('button', { name: /อัปเดตตอนนี้|update now/i }))

    expect(update).toHaveBeenCalledOnce()
  })

  it('stays hidden when there is no new version', () => {
    render(<PwaUpdatePrompt needRefresh={false} onUpdate={() => undefined} onDismiss={() => undefined} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
