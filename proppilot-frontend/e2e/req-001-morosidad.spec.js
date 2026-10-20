import { test, expect } from '@playwright/test'
import { login, apiGet, formatArs } from './helpers'

// REQ-001: overdue rent card on the dashboard, list dialog and reminder message.
// Needs seeded data with at least one tenant behind (scripts/seed.py).

test('dashboard shows delinquency from the API and the dialog lists a tenant with 2 unpaid months', async ({ page }) => {
  const token = await login(page)
  const data = await apiGet(page, token, '/delinquency')
  // must fail on an empty result, not pass vacuously
  expect(data.tenantCount).toBeGreaterThanOrEqual(1)

  const card = page.getByTestId('delinquency-card')
  await expect(card).toBeVisible()
  await expect(page.getByTestId('delinquency-total')).toContainText(formatArs(data.totalOwed))
  await expect(page.getByTestId('delinquency-count')).toContainText(String(data.tenantCount))

  await card.click()
  const twoMonths = data.items.find((i) => i.monthsOwed === 2)
  expect(twoMonths, 'seed should have a tenant with 2 unpaid months').toBeTruthy()
  const row = page.getByTestId('delinquency-row').filter({ hasText: twoMonths.tenantName })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Vencido')
})

test('reminder message names the tenant and WhatsApp link is wa.me', async ({ page }) => {
  const token = await login(page)
  const data = await apiGet(page, token, '/delinquency')
  expect(data.tenantCount).toBeGreaterThanOrEqual(1)
  // first tenant with a usable phone: rows without digits get a disabled WhatsApp button by design
  const first = data.items.find((i) => (i.tenantPhone || '').replace(/\D/g, ''))
  expect(first).toBeTruthy()

  await page.getByTestId('delinquency-card').click()
  await page.getByTestId('delinquency-row').filter({ hasText: first.tenantName }).getByRole('button', { name: 'Recordar' }).click()

  await expect(page.getByTestId('delinquency-message')).toHaveValue(new RegExp(first.tenantName))
  const wa = page.getByRole('link', { name: 'Abrir en WhatsApp' })
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\//)
})
