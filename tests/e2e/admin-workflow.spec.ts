import { expect, test } from '@playwright/test'

async function mockUser(page: import('@playwright/test').Page, roles: string[]) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: object) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-1', exp: expiresAt, role: 'authenticated' })}.signature`
  await page.addInitScript(({ accessToken, expiration }) => localStorage.setItem('sb-example-auth-token', JSON.stringify({
    access_token: accessToken, refresh_token: 'refresh', expires_at: expiration, expires_in: 3600, token_type: 'bearer',
    user: { id: 'user-1', aud: 'authenticated', role: 'authenticated' },
  })), { accessToken: token, expiration: expiresAt })
  await page.route('https://example.supabase.co/rest/v1/profiles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: 'user-1', display_name: 'Admin', avatar_url: null, locale: 'th', target_score: 650,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }) }))
  await page.route('https://example.supabase.co/rest/v1/user_roles**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(roles.map((role) => ({ role }))) }))
}

test('admin validates a complete JSONL content draft', async ({ page }) => {
  await mockUser(page, ['user', 'admin'])
  await page.goto('/admin/import')
  await expect(page.getByRole('heading', { name: /นำเข้าข้อสอบ|import content/i })).toBeVisible()
  const draft = { groupId: 'g1', part: 5, groupType: 'single', difficulty: 'medium', media: [], questions: [{
    id: 'q1', prompt: { text: 'Question' }, choiceShuffleAllowed: true,
    choices: ['A', 'B', 'C', 'D'].map((label, index) => ({ id: label, label, content: { text: label }, correct: index === 0 })),
    translations: { th: { explanation: 'คำอธิบาย', promptTranslation: 'คำแปล' }, en: { explanation: 'Explanation' } },
  }] }
  await page.getByLabel('JSONL').fill(JSON.stringify(draft))
  await page.getByRole('button', { name: /ตรวจไฟล์|validate file/i }).click()
  await expect(page.getByRole('status')).toContainText(/พร้อมนำเข้า|ready to import/i)
})

test('regular users cannot open content administration', async ({ page }) => {
  await mockUser(page, ['user'])
  await page.goto('/admin')
  await expect(page.getByText(/ไม่มีสิทธิ์|not authorized/i)).toBeVisible()
})

test('admin import stays within phone, iPad, and desktop viewports', async ({ page }) => {
  await mockUser(page, ['user', 'admin'])
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/admin/import')
    await expect(page.getByRole('heading', { name: /นำเข้าข้อสอบ|import content/i })).toBeVisible()
    const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
    expect(size.width).toBeLessThanOrEqual(size.viewport)
  }
})

test('admin edits and saves a complete question draft on mobile', async ({ page }) => {
  await mockUser(page, ['user', 'admin'])
  await page.setViewportSize({ width: 320, height: 640 })
  await page.route('https://example.supabase.co/rest/v1/question_versions**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    id: '00000000-0000-0000-0000-000000000001', prompt: { text: 'The report is due ____ Friday.' }, difficulty: 'medium', status: 'draft',
    created_at: '2026-10-21T00:00:00Z', created_by: 'user-1', questions: { part: 5 },
    choices: ['at', 'on', 'in', 'by'].map((text, index) => ({ id: `00000000-0000-0000-0000-00000000000${index + 2}`, label: String.fromCharCode(65 + index), content: { text }, is_correct: index === 0, position: index + 1 })),
    translations: [{ locale: 'th', prompt_translation: 'คำแปล', explanation: 'คำอธิบาย', transcript: null }, { locale: 'en', prompt_translation: null, explanation: 'Explanation', transcript: null }],
  }) }))
  let payload: unknown
  await page.route('https://example.supabase.co/rest/v1/rpc/update_question_draft', async (route) => { payload = route.request().postDataJSON(); await route.fulfill({ status: 204 }) })

  await page.goto('/admin/questions/00000000-0000-0000-0000-000000000001')
  await page.getByLabel(/ตัวเลือก B|Choice B/i).fill('before')
  await page.getByLabel(/คำตอบที่ถูก B|Correct answer B/i).check()
  await page.getByRole('button', { name: /บันทึก Draft|Save draft/i }).click()

  await expect(page.getByRole('status')).toContainText(/บันทึก Draft แล้ว|Draft saved/i)
  expect(payload).toMatchObject({ p_question_version_id: '00000000-0000-0000-0000-000000000001', p_payload: { choices: expect.arrayContaining([expect.objectContaining({ label: 'B', text: 'before', correct: true })]) } })
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(size.width).toBeLessThanOrEqual(size.viewport)
})
