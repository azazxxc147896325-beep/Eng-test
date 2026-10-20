import { expect, test } from '@playwright/test'

test('redirects a blocked admin user to Google login', async ({ page }) => {
  await page.route('https://example.supabase.co/auth/v1/authorize**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Google OAuth</h1>' }),
  )

  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)

  const authorization = page.waitForRequest(/\/auth\/v1\/authorize/)
  await page.getByRole('button', { name: /Google/i }).click()
  const request = await authorization
  const url = new URL(request.url())

  expect(url.searchParams.get('provider')).toBe('google')
  expect(url.searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/auth/callback')
})

test('recovers a callback, returns to the intended page, and signs out', async ({ page }) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: object) => btoa(JSON.stringify(value))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp: expiresAt, role: 'authenticated' })}.signature`

  await page.addInitScript(({ token, expiration }) => {
    localStorage.setItem('sb-example-auth-token', JSON.stringify({
      access_token: token,
      refresh_token: 'refresh-token',
      expires_at: expiration,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: 'user-1', email: 'learner@example.com', aud: 'authenticated', role: 'authenticated' },
    }))
    sessionStorage.setItem('score-quest:return-to', '/results')
  }, { token: accessToken, expiration: expiresAt })

  await page.route('https://example.supabase.co/rest/v1/profiles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: 'user-1', display_name: 'Learner', avatar_url: null, locale: 'th', target_score: 650,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }) }),
  )
  await page.route('https://example.supabase.co/rest/v1/user_roles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[{"role":"user"}]' }),
  )
  await page.route('https://example.supabase.co/auth/v1/logout**', (route) =>
    route.fulfill({ status: 204, body: '' }),
  )

  await page.goto('/auth/callback')
  await expect(page).toHaveURL(/\/results$/)
  await page.getByRole('button', { name: /ออกจากระบบ|sign out/i }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
})
