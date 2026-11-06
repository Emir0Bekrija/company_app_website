import { expect, test } from '@playwright/test'

test('hub renders its modules and leaves cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.locator('#platform').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('hub-tile')).toHaveCount(8)
  await expect(page.getByTestId('hub-core')).toBeVisible()
  await page.locator('footer a[href="/privacy"]').click()
  await expect(page).toHaveURL(/\/privacy$/)
  await page.waitForTimeout(800)
  expect(errors).toEqual([])
})
