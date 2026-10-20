import { test, expect } from '@playwright/test'
import { login, apiGet, formatArs } from './helpers'

// Smoke test for the local stack (backend on :8080, or BACKEND_PORT in a parallel worktree, with profile `local`, data from scripts/seed.py).
// Logs in as the local-dev user that owns the seeded data and checks the UI against the API.

test('dashboard counts match the API', async ({ page }) => {
  const token = await login(page)
  const units = await apiGet(page, token, '/property-units')
  const active = await apiGet(page, token, '/leases/active')
  test.skip(units.length === 0, 'No data. Run scripts/seed.py first.')

  await expect(page.getByText('Total de Propiedades')).toBeVisible()
  const card = (label) => page.locator('div', { has: page.getByText(label, { exact: true }) }).last()
  await expect(card('Total de Propiedades').getByRole('heading')).toHaveText(String(units.length))
  await expect(card('Contratos Activos').getByRole('heading')).toHaveText(String(active.length))
})

test('lease detail shows rent adjusted by index', async ({ page }) => {
  const token = await login(page)
  const leases = await apiGet(page, token, '/leases/active')
  const lease = leases.find((l) => l.adjustmentIndex === 'ICL')
  test.skip(!lease, 'No active ICL lease. Run scripts/seed.py first.')
  const adjusted = await apiGet(page, token, `/leases/${lease.id}/adjusted-rent`)

  await page.getByRole('button', { name: 'Contratos' }).click()
  await page.getByRole('row', { name: new RegExp(lease.propertyAddress.slice(0, 20)) }).first().click()

  await expect(page.getByText('Alquiler ajustado a hoy')).toBeVisible()
  if (adjusted.hasAdjustment) {
    await expect(page.getByText(formatArs(adjusted.adjustedAmount)).first()).toBeVisible()
  }
})
