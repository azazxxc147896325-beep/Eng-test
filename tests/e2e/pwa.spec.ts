import { expect, test } from '@playwright/test'

test('publishes installable PWA metadata and a service worker', async ({ page }) => {
  await page.goto('/home')

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestHref).toBe('/manifest.webmanifest')
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker?.ready.then(Boolean))).toBe(true)
})
