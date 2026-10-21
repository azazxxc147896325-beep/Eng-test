import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '../i18n'
import type { AttemptRepository, AttemptSnapshot } from '../exam/data/AttemptRepository'
import { ModeSelectPage } from './ModeSelectPage'

const snapshot = { id: 'attempt-1' } as AttemptSnapshot

describe('ModeSelectPage', () => {
  beforeEach(async () => { await i18n.changeLanguage('th') })

  it('creates a full test and opens its exam workspace', async () => {
    const repository: AttemptRepository = { create: vi.fn().mockResolvedValue(snapshot), resume: vi.fn() }
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/play']}>
          <Routes>
            <Route path="/play" element={<ModeSelectPage repository={repository} />} />
            <Route path="/attempt/:attemptId" element={<main>EXAM WORKSPACE</main>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /เริ่ม Full Test/ }))

    await waitFor(() => expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ mode: 'full', locale: 'th' })))
    expect(await screen.findByText('EXAM WORKSPACE')).toBeVisible()
  })

  it('uses the selected Part, difficulty, and question count for practice', async () => {
    const repository: AttemptRepository = { create: vi.fn().mockResolvedValue(snapshot), resume: vi.fn() }
    render(<I18nextProvider i18n={i18n}><MemoryRouter><ModeSelectPage repository={repository} /></MemoryRouter></I18nextProvider>)

    fireEvent.change(screen.getByLabelText('Part'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText(/ระดับ/), { target: { value: 'hard' } })
    fireEvent.change(screen.getByLabelText(/จำนวนข้อ/), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /เริ่มฝึก Part/ }))

    await waitFor(() => expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'practice', part: 7, difficulty: 'hard', questionCount: 20,
    })))
  })
})
