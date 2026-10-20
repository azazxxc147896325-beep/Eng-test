import { expect, test } from '@playwright/test'

const snapshot = {
  id: 'attempt-1', mode: 'practice', status: 'in_progress', locale: 'th', seed: 'seed',
  currentSection: 'practice', serverNow: new Date().toISOString(), startedAt: new Date().toISOString(), sectionExpiresAt: null,
  items: [{
    attemptItemId: 'item-1', ordinal: 1, section: 'practice', part: 7, groupId: 'group-1', questionVersionId: 'q-1',
    prompt: { text: 'What is the purpose of the email?', documents: [{ title: 'Email', text: 'A long practice document. '.repeat(100) }] },
    media: [], choiceShuffleAllowed: true, choiceOrder: ['a', 'b'],
    choices: [{ id: 'a', label: 'A', content: { text: 'To confirm a booking' } }, { id: 'b', label: 'B', content: { text: 'To cancel a meeting' } }],
  }],
}

test.beforeEach(async ({ page }) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp: expiresAt, role: 'authenticated' })}.signature`
  await page.addInitScript(({ accessToken, expiration }) => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: accessToken, refresh_token: 'refresh', expires_at: expiration, expires_in: 3600, token_type: 'bearer',
    user: { id: 'user-1', email: 'learner@example.com', aud: 'authenticated', role: 'authenticated' },
  })), { accessToken: token, expiration: expiresAt })
  await page.route('https://example.supabase.co/rest/v1/profiles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'user-1', display_name: 'Learner', avatar_url: null, locale: 'th', target_score: 650,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }) }))
  await page.route('https://example.supabase.co/rest/v1/user_roles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[{"role":"user"}]' }))
  await page.route('https://example.supabase.co/functions/v1/create-attempt', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(snapshot),
  }))
})

test('keeps the exam in one viewport on phone, iPad, and desktop', async ({ page }) => {
  const viewports = [
    { width: 390, height: 844 }, { width: 375, height: 667 },
    { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/attempt/attempt-1')
    await expect(page.getByText('What is the purpose of the email?')).toBeVisible()
    expect(await page.evaluate(() => document.scrollingElement?.scrollHeight)).toBe(viewport.height)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: /ข้อ|questions/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})
