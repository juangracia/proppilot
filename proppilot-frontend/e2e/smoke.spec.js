/* global process */
import { test, expect } from '@playwright/test'

// Smoke test: the UI shows what the API returns for the seeded data (scripts/seed.sh).
// Needs the stack up: scripts/dev-up.sh --seed. Backend runs with profile local.

const EMAIL = process.env.SEED_EMAIL || 'juanmgracia@gmail.com'
const NAME = process.env.SEED_NAME || 'Juan Gracia'

// The UI formats money with es-AR; normalise non-breaking spaces before comparing.
const ars = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
    .format(n)
    .replace(/\s/g, ' ')

test.describe('smoke: UI matches API', () => {
  let api
  const consoleErrors = []

  test.beforeEach(async ({ page, request }) => {
    consoleErrors.length = 0
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

    // Dev login (profile local): same call the login page makes.
    const res = await request.post('/api/auth/local', { data: { email: EMAIL, name: NAME } })
    expect(res.ok(), 'POST /api/auth/local').toBeTruthy()
    const { token } = await res.json()
    api = async (path) => {
      const r = await request.get(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
      expect(r.ok(), `GET /api${path}`).toBeTruthy()
      return r.json()
    }
    await page.goto('/')
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('proppilot_tour_completed', 'true') // keep the product tour out of the way
    }, token)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(() => {
    expect(consoleErrors, 'browser console errors').toEqual([])
  })

  test('seeded data exists', async () => {
    const properties = await api('/property-units')
    expect(properties.length, 'run scripts/seed.sh first').toBeGreaterThan(0)
  })

  test('dashboard counts match the API', async ({ page }) => {
    const properties = await api('/property-units')
    const leases = await api('/leases')
    const active = leases.filter((l) => l.status === 'ACTIVE').length
    const body = page.locator('body')
    await expect(body).toContainText(new RegExp(`${properties.length}\\s*Total de Propiedades`))
    await expect(body).toContainText(new RegExp(`${active}\\s*Contratos Activos`))
  })

  test('properties view shows each property address and rent', async ({ page }) => {
    const properties = await api('/property-units')
    await page.getByRole('button', { name: /Propiedades/i }).first().click()
    const body = page.locator('body')
    for (const p of properties) {
      await expect(body, `address of property ${p.id}`).toContainText(p.fullAddress)
    }
    const occupied = properties.find((p) => p.activeLeaseId)
    await expect(body).toContainText(ars(occupied.baseRentAmount))
    await expect(body).toContainText(occupied.currentTenantName)
  })

  test('tenants view lists every tenant', async ({ page }) => {
    const tenants = await api('/tenants')
    await page.getByRole('button', { name: /Inquilinos/i }).first().click()
    const body = page.locator('body')
    await expect(body).toContainText(`Total: ${tenants.length} inquilinos`)
    for (const t of tenants) {
      await expect(body, `tenant ${t.id}`).toContainText(t.fullName, { ignoreCase: true })
      await expect(body).toContainText(t.email)
    }
  })

  test('leases view shows the lease count per filter', async ({ page }) => {
    const leases = await api('/leases')
    await page.getByRole('button', { name: /Contratos/i }).first().click()
    const body = page.locator('body')
    const count = (s) => leases.filter((l) => l.status === s).length
    await expect(body).toContainText(`Todos (${leases.length})`)
    await expect(body).toContainText(`Contratos Activos (${count('ACTIVE')})`)
    await expect(body).toContainText(`Terminados (${count('TERMINATED')})`)
  })

  test('payments view shows the payment counts and an amount', async ({ page }) => {
    const payments = await api('/payments')
    await page.getByRole('button', { name: /Pagos/i }).first().click()
    const body = page.locator('body')
    await expect(body).toContainText(`Todos (${payments.length})`)
    await expect(body).toContainText(`Pendiente (${payments.filter((p) => p.status === 'PENDING').length})`)
    await expect(body).toContainText(ars(payments[0].amount))
  })

  test('adjusted rent API reports an adjustment for an ICL lease', async () => {
    const leases = await api('/leases')
    const icl = leases.find((l) => l.adjustmentIndex === 'ICL' && l.status === 'ACTIVE')
    const adj = await api(`/leases/${icl.id}/adjusted-rent`)
    expect(adj.hasAdjustment).toBe(true)
    expect(adj.adjustedAmount).toBeGreaterThan(adj.baseAmount)
  })
})
