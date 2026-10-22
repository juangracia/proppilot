/* global process */
import { test, expect } from '@playwright/test'

const EMAIL = process.env.SEED_EMAIL || 'juanmgracia@gmail.com'
const NAME = process.env.SEED_NAME || 'Juan Gracia'

test('agenda at 375px: page keeps the viewport width and the table scrolls in its box', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  const res = await request.post('/api/auth/local', { data: { email: EMAIL, name: NAME } })
  const { token } = await res.json()
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
    localStorage.setItem('proppilot_tour_completed', 'true')
  }, token)
  await page.goto('/')
  await page.getByLabel('open drawer').click()
  await page.getByText('Agenda', { exact: true }).locator('visible=true').first().click()
  await expect(page.getByRole('heading', { name: 'Agenda de contratos' })).toBeVisible()

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(pageWidth).toBe(375)

  const box = page.getByTestId('agenda-table').locator('xpath=..')
  const ene = page.getByRole('columnheader', { name: 'Ene' })
  await box.evaluate((el) => { el.scrollLeft = el.scrollWidth })
  const [boxRect, eneRect] = await Promise.all([box.boundingBox(), ene.boundingBox()])
  expect(boxRect.width).toBeLessThanOrEqual(375)
  expect(eneRect.x).toBeGreaterThanOrEqual(0)
  expect(eneRect.x + eneRect.width).toBeLessThanOrEqual(375)
})
