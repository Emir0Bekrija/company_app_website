import { expect, test, type Page } from '@playwright/test'
import { createSeed } from '../lib/demo/engine'
import { STRINGS } from '../lib/demo/strings'
import { stepTargets, TOURS, tourState } from '../lib/demo/tours'
import { FEATURE_GROUPS } from '../lib/features/modules'

const FEATURES = FEATURE_GROUPS.flatMap((g) => g.modules)

const card = (page: Page) => page.getByTestId('tour-card')
const frame = (page: Page) => page.locator('#demo-frame')
const tour = (page: Page, name: string) => frame(page).locator(`[data-tour="${name}"]:visible`).first()
const progress = async (page: Page, n: number, total: number) =>
  expect(page.getByTestId('tour-progress')).toHaveText(`Step ${n} of ${total}`)

for (const [prefix, index] of [['', 0], ['/bs', 1]] as const) {
  test(`every feature links to its own presentation: ${prefix || '/'}`, async ({ page }) => {
    await page.goto(`${prefix}/features`)
    const hrefs = await page.getByTestId('feature-tour').evaluateAll((links) => links.map((a) => a.getAttribute('href')))
    expect(hrefs).toEqual(FEATURES.map((id) => `${prefix}/demo?tour=${id}`))
  })

  for (const id of FEATURES) {
    test(`opens the right screen and first step: ${prefix}/demo?tour=${id}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`${prefix}/demo?tour=${id}`)
      const definition = TOURS[id]
      await expect(page.getByTestId('tour-text')).toHaveText(STRINGS[definition.steps[0].key][index])
      await expect(frame(page).locator('button[aria-current="page"]:visible').first()).toHaveAttribute('data-tour', `nav-${definition.start}`)
      await expect(card(page)).toBeInViewport()
      expect(errors).toEqual([])
    })
  }
}

test('an unknown tour opens the plain demo', async ({ page }) => {
  await page.goto('/demo?tour=nope')
  await expect(frame(page).getByRole('button', { name: 'Autofill month' })).toBeVisible()
  await expect(card(page)).toHaveCount(0)
})

test('the tab highlight follows the frame', async ({ page }) => {
  await page.goto('/demo?tour=expenses')
  await expect(page.getByRole('tab', { name: 'Expenses' })).toHaveAttribute('aria-selected', 'true')
})

test('overtime, from the day to the balance', async ({ page }) => {
  await page.goto('/demo?tour=overtime')
  await progress(page, 1, 7)
  await frame(page).locator('[data-day]', { hasText: '+1h 30m' }).click()
  await tour(page, 'overtime-toil').click()
  await progress(page, 2, 7)
  await frame(page).getByRole('button', { name: 'Close' }).first().click()
  await tour(page, 'role').getByRole('radio', { name: 'HR' }).click()
  await tour(page, 'nav-approvals').click()
  await tour(page, 'overtime-approve').click()
  await tour(page, 'role').getByRole('radio', { name: 'Worker' }).click()
  await tour(page, 'nav-toil').click()
  await expect(frame(page).getByTestId('toil-available')).toHaveText('1h 30m')
  await page.getByTestId('tour-next').click()
  await expect(page.getByTestId('tour-text')).toHaveText(STRINGS['tour.overtime.done'][0])
})

test('Next works while a dialog is open', async ({ page }) => {
  await page.goto('/demo?tour=timesheets')
  const [, freeDay] = stepTargets(TOURS.timesheets.steps[0], tourState(TOURS.timesheets, createSeed(new Date())))
  await tour(page, freeDay).click()
  await tour(page, 'autofill-day').click()
  await progress(page, 2, 4)
  await page.getByTestId('tour-next').click()
  await progress(page, 3, 4)
  await expect(frame(page).getByRole('dialog')).toBeVisible()
})

test('expenses, from a new record to the attachment', async ({ page }) => {
  await page.goto('/demo?tour=expenses')
  await tour(page, 'expense-new').click()
  await frame(page).getByLabel('Description').fill('Team lunch')
  await tour(page, 'expense-save').click()
  await progress(page, 2, 3)
  await frame(page).locator('[data-tour^="expense-attach-"]').first().click()
  await progress(page, 3, 3)
  await page.getByTestId('tour-next').click()
  await expect(page.getByTestId('tour-text')).toHaveText(STRINGS['tour.expenses.done'][0])
})

test('security, from setup to a company rule', async ({ page }) => {
  await page.goto('/demo?tour=security')
  await tour(page, 'twofa-start').click()
  await tour(page, 'twofa-verify').click()
  await progress(page, 2, 3)
  await tour(page, 'twofa-ack').click()
  await tour(page, 'twofa-done').click()
  await progress(page, 3, 3)
  await tour(page, 'twofa-everyone').click()
  await expect(page.getByTestId('tour-text')).toHaveText(STRINGS['tour.security.done'][0])
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('vacation works at 360px, with no sideways scroll', async ({ page }) => {
    await page.goto('/demo?tour=vacation')
    await tour(page, 'leave-request').click()
    await tour(page, 'leave-send').click()
    await progress(page, 2, 7)
    await tour(page, 'role').getByRole('radio', { name: 'HR' }).click()
    await tour(page, 'nav-approvals').click()
    await tour(page, 'leave-approve').click()
    await tour(page, 'role').getByRole('radio', { name: 'Worker' }).click()
    await tour(page, 'nav-leave').click()
    await expect(frame(page).getByTestId('leave-remaining')).toHaveText('16')
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(sideways).toBe(false)
  })
})
