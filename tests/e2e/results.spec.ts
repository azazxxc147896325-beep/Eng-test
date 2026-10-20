import { expect, test } from '@playwright/test'

test('shows submitted results, translated review, and verified Full Test history', async ({ page }) => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp: expiresAt, role: 'authenticated' })}.signature`
  await page.addInitScript(({ accessToken, expiration }) => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: accessToken, refresh_token: 'refresh', expires_at: expiration, expires_in: 3600, token_type: 'bearer',
    user: { id: 'user-1', aud: 'authenticated', role: 'authenticated' },
  })), { accessToken: token, expiration: expiresAt })
  await page.route('https://example.supabase.co/rest/v1/profiles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'user-1', display_name: 'Learner', avatar_url: null, locale: 'th', target_score: 650,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }) }))
  await page.route('https://example.supabase.co/rest/v1/user_roles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[{"role":"user"}]' }))
  await page.route('https://example.supabase.co/functions/v1/submit-attempt', async (route) => {
    const action = (route.request().postDataJSON() as { action: string }).action
    const result = { mode: 'full', scoringVersion: 'sq-v1', section: { listening: 330, reading: 320 }, total: 650,
      range: null, accuracy: 65, parts: [{ part: 5, correct: 18, total: 30, accuracy: 60 }], skills: {}, weakParts: [5] }
    const review = { attemptId: 'a1', status: 'submitted', locale: 'th', items: [{ ordinal: 1, part: 5,
      prompt: { text: 'The meeting has been postponed.' }, selectedChoiceId: 'a', correctChoiceId: 'b',
      choices: [{ id: 'a', label: 'A', content: { text: 'postpone' } }, { id: 'b', label: 'B', content: { text: 'postponed' } }],
      explanation: { th: 'ต้องใช้รูป past participle', en: 'Use the past participle.' }, promptTranslation: 'การประชุมถูกเลื่อน', transcript: null }] }
    const history = [
      { attemptId: 'old', mode: 'full', timingUnverified: false, submittedAt: '2026-10-01T00:00:00Z', total: 600, listening: 300, reading: 300 },
      { attemptId: 'practice', mode: 'practice', timingUnverified: false, submittedAt: '2026-10-02T00:00:00Z', total: null, listening: null, reading: null },
      { attemptId: 'new', mode: 'full', timingUnverified: false, submittedAt: '2026-10-03T00:00:00Z', total: 650, listening: 330, reading: 320 },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(
      action === 'result' ? { result } : action === 'review' ? { review } : { history },
    ) })
  })

  await page.goto('/results/a1')
  await expect(page.getByText(/คะแนนประมาณการ|estimated score/i)).toBeVisible()
  await expect(page.getByText('650')).toBeVisible()
  await page.goto('/results/a1/review')
  await expect(page.getByText('The meeting has been postponed.')).toBeVisible()
  await expect(page.getByText('ต้องใช้รูป past participle')).toBeVisible()
  await page.goto('/history')
  await expect(page.getByText(/\+50/)).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
})
