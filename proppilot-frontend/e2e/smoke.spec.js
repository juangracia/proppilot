import { test, expect } from '@playwright/test'

// Smoke test for the local stack (backend on :8080, or BACKEND_PORT in a parallel worktree, with profile `local`, data from scripts/seed.py).
// Logs in as the local-dev user that owns the seeded data and checks the UI against the API.
const API_BASE = `http://localhost:${process.env.BACKEND_PORT || 8080}/api`
// Must match app.local-dev.email in proppilot-backend/src/main/resources/application-local.yml
const LOCAL_DEV_EMAIL = 'juanmgracia@gmail.com'

const formatArs = (n) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

async function login(page) {
  const res = await page.request.post(`${API_BASE}/auth/local`, {
    data: { email: LOCAL_DEV_EMAIL, name: 'Local Developer' }
  })
  expect(res.ok()).toBeTruthy()
  const { token } = await res.json()
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
    localStorage.setItem('proppilot_tour_completed', 'true')
  }, token)
  await page.reload()
  return token
}

async function apiGet(page, token, path) {
  const res = await page.request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

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
