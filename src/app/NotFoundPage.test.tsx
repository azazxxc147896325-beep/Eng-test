import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotFoundPage } from './NotFoundPage'

afterEach(cleanup)

describe('NotFoundPage', () => {
  it('gives the user a working route back to the app', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /ไม่พบหน้านี้|page not found/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /กลับหน้าหลัก|back to home/i })).toHaveAttribute('href', '/home')
  })
})
