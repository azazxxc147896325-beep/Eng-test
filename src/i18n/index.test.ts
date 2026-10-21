import { describe, expect, it } from 'vitest'
import { i18n, setLanguage } from './index'

describe('i18n', () => {
  it('translates the primary play action', () => {
    expect(i18n.t('home.play', { lng: 'th' })).toBe('เล่น')
    expect(i18n.t('home.play', { lng: 'en' })).toBe('Play')
  })

  it('translates the admin question bank', () => {
    expect(i18n.t('admin.bank', { lng: 'th' })).toBe('คลังข้อสอบ')
    expect(i18n.t('admin.bank', { lng: 'en' })).toBe('Question bank')
  })

  it('persists the selected locale only', async () => {
    await setLanguage('en')

    expect(localStorage.getItem('score-quest-locale')).toBe('en')
  })
})
