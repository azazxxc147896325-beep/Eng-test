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
