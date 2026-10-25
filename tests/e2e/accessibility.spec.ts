import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const publicPages = ['/', '/login', '/route-that-does-not-exist']

test('public entry pages have no automatically detectable WCAG A or AA violations', async ({ page }) => {
  for (const path of publicPages) {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()

    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(scan.violations, `${path}: ${scan.violations.map((item) => item.id).join(', ')}`).toEqual([])
  }
})

test('public entry pages do not overflow phone or iPad screens', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 640 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport)
    for (const path of publicPages) {
      await page.goto(path)
      await expect(page.locator('main')).toBeVisible()
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(width, `${path} at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(viewport.width)
    }
  }
})
