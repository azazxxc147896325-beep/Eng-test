import { expect, test } from '@playwright/test'

test('Full Listening autoplays once and does not replay after reload', async ({ page }) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp: expiresAt, role: 'authenticated' })}.signature`
  await page.addInitScript(({ accessToken, expiration }) => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify({ access_token: accessToken, refresh_token: 'refresh', expires_at: expiration,
      expires_in: 3600, token_type: 'bearer', user: { id: 'user-1', aud: 'authenticated', role: 'authenticated' } }))
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value() {
      const browserWindow = window as unknown as { __playCalls?: number }
      browserWindow.__playCalls = (browserWindow.__playCalls ?? 0) + 1
      return Promise.resolve()
    } })
  }, { accessToken: token, expiration: expiresAt })
  await page.route('https://example.supabase.co/rest/v1/profiles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'user-1', display_name: 'Learner', avatar_url: null, locale: 'th', target_score: 650,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }) }))
  await page.route('https://example.supabase.co/rest/v1/user_roles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[{"role":"user"}]' }))
  await page.route('https://example.supabase.co/functions/v1/create-attempt', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'attempt-listening', mode: 'full', status: 'in_progress', locale: 'th', seed: 'seed', currentSection: 'listening',
    serverNow: new Date().toISOString(), startedAt: new Date().toISOString(), sectionExpiresAt: new Date(Date.now() + 2_700_000).toISOString(),
    items: [{ attemptItemId: 'item-1', ordinal: 1, section: 'listening', part: 1, groupId: null, questionVersionId: 'q1',
      prompt: { text: 'Look at the picture.' }, choiceShuffleAllowed: false, choiceOrder: ['a'],
      media: [{ id: 'audio-1', kind: 'audio', storagePath: '/audio.mp3', metadata: {} }],
      choices: [{ id: 'a', label: 'A', content: { text: 'Choice A' } }] }],
  }) }))

  await page.goto('/attempt/attempt-listening')
  const audio = page.getByLabel('Listening audio')
  await audio.dispatchEvent('loadeddata')
  await expect.poll(() => page.evaluate(() => (window as unknown as { __playCalls?: number }).__playCalls ?? 0)).toBe(1)
  await expect(audio).not.toHaveAttribute('controls', '')

  await page.reload()
  await audio.dispatchEvent('loadeddata')
  await expect.poll(() => page.evaluate(() => (window as unknown as { __playCalls?: number }).__playCalls ?? 0)).toBe(0)
})
