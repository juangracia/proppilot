/* global process */
import { test, expect } from '@playwright/test'

// REQ-001 Morosidad browser cases U1-U15 + md-width check (lanes/req-001-morosidad/plan.md).
// Needs the lane stack seeded (scripts/seed.sh --reset) and asOf = run date 2026-10-22.
// Run: FRONTEND_PORT=3001 npx playwright test e2e/req-001-morosidad.spec.js --reporter=list

const EVIDENCE =
  process.env.EVIDENCE_DIR ||
  '/Users/juangracia/brain/10-projects/proppilot/cold-22oct/lanes/req-001-morosidad/evidence'
const API = `http://localhost:${process.env.BACKEND_PORT || 8081}/api`
const EMAIL = process.env.SEED_EMAIL || 'juanmgracia@gmail.com'
const NAME = process.env.SEED_NAME || 'Juan Gracia'

const ADDR2 = 'Obispo Trejo 245, Piso 2, Depto A'
const ADDR4 = 'Av. Santa Fe 2150, Piso 5, Depto C'

// Tests run in file order with --workers=1; U15 is last because it changes data.

test.describe('REQ-001 morosidad', () => {
  let token
  let consoleErrors
  let allowErrors
  const requestUrls = []

  const shot = (page, name) => page.screenshot({ path: `${EVIDENCE}/${name}.png`, fullPage: true })
  const authHeaders = () => ({ Authorization: `Bearer ${token}` })

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API}/auth/local`, { data: { email: EMAIL, name: NAME } })
    expect(res.ok()).toBeTruthy()
    token = (await res.json()).token
  })

  test.beforeEach(async ({ page, context }) => {
    consoleErrors = []
    allowErrors = null
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    page.on('request', (r) => {
      if (r.url().includes('/api/delinquency')) requestUrls.push(r.url())
    })
    await page.goto('/')
    await page.evaluate((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('proppilot_tour_completed', 'true')
    }, token)
  })

  test.afterAll(() => {
    console.log('delinquency request URLs:', [...new Set(requestUrls)].join(' '))
  })

  test.afterEach(() => {
    const errs = allowErrors ? consoleErrors.filter((e) => !allowErrors.test(e)) : consoleErrors
    expect(errs, 'unexpected browser console errors').toEqual([])
  })

  const openPanel = async (page) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('delinquency-card')).toBeVisible()
  }

  // Amount text must fit inside its element (catches clipped values).
  const expectAmountNotClipped = async (page) => {
    const clipped = await page
      .getByTestId('delinquency-card')
      .locator('h6')
      .evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent))
    expect.soft(clipped, 'Morosidad amount clipped').toEqual([])
  }

  const switchToEnglish = async (page) => {
    await page.locator('button:has([data-testid="LanguageIcon"])').first().click()
    await page.getByRole('menuitem', { name: /English/i }).click()
  }

  test('U1 card in stats row, amount, subtitle, table below', async ({ page }) => {
    await openPanel(page)
    const card = page.getByTestId('delinquency-card')
    await expect(card).toContainText('Morosidad')
    await expect(card).toContainText('NUEVO')
    await expect(card).toContainText('$ 1.490.000')
    await expect(card).toContainText('2 inquilinos atrasados')
    const grid = page.locator('[data-tour="dashboard-stats"]')
    await expect(grid.getByTestId('delinquency-card')).toBeVisible()
    const cardBox = await card.boundingBox()
    const others = await grid.locator('.MuiCard-root').evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().top)
    )
    const sameRow = others.filter((t) => Math.abs(t - cardBox.y) < 4)
    expect(sameRow.length, 'cards in the same row as Morosidad').toBeGreaterThanOrEqual(4)
    const tableBox = await page.getByTestId('delinquency-table').boundingBox()
    expect(tableBox.y, 'table below the grid').toBeGreaterThan(cardBox.y + cardBox.height)
    await expectAmountNotClipped(page)
    await shot(page, 'U1-dashboard-es')
  })

  test('U2 table headers', async ({ page }) => {
    await openPanel(page)
    const head = page.getByTestId('delinquency-table').locator('thead th')
    await expect(head).toHaveText(['Inquilino', 'Propiedad', 'Atraso', 'Adeuda', ''])
    await shot(page, 'U2-headers')
  })

  test('U3 row order and data', async ({ page }) => {
    await openPanel(page)
    const rows = page.getByTestId('delinquency-table').locator('tbody tr')
    await expect(rows).toHaveCount(2)
    const r1 = rows.nth(0).locator('td')
    await expect(r1.nth(0)).toHaveText('Lucas Ezequiel Ferreyra, Camila Belén Ferreyra')
    await expect(r1.nth(1)).toHaveText(ADDR2)
    await expect(r1.nth(2)).toHaveText('Vencido · 51 días')
    await expect(r1.nth(3)).toHaveText('$ 840.000')
    const r2 = rows.nth(1).locator('td')
    await expect(r2.nth(0)).toHaveText('Valentina Rojas')
    await expect(r2.nth(1)).toHaveText(ADDR4)
    await expect(r2.nth(2)).toHaveText('Vencido · 21 días')
    await expect(r2.nth(3)).toHaveText('$ 650.000')
    await shot(page, 'U3-rows')
  })

  test('U4 UI matches API', async ({ page, request }) => {
    const r = await request.get(`${API}/delinquency`, { headers: authHeaders() })
    expect(r.ok()).toBeTruthy()
    const report = await r.json()
    expect(report.items.length).toBeGreaterThan(0)
    await openPanel(page)
    const fmt = (n) => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`
    await expect(page.getByTestId('delinquency-card')).toContainText(fmt(report.totalOwed))
    const rows = page.getByTestId('delinquency-table').locator('tbody tr')
    await expect(rows).toHaveCount(report.items.length)
    for (const [i, it] of report.items.entries()) {
      const tds = rows.nth(i).locator('td')
      await expect(tds.nth(0)).toHaveText(it.tenantNames.join(', '))
      await expect(tds.nth(1)).toHaveText(it.propertyAddress)
      await expect(tds.nth(2)).toHaveText(`Vencido · ${it.daysOverdue} días`)
      await expect(tds.nth(3)).toHaveText(fmt(it.amountOwed))
    }
    await shot(page, 'U4-api-match')
  })

  test('U5 reminder dialog for row 2', async ({ page }) => {
    await openPanel(page)
    await page.getByRole('button', { name: 'Recordar' }).nth(1).click()
    const dlg = page.getByRole('dialog')
    await expect(dlg).toContainText('Recordatorio de pago')
    const text = await dlg.locator('textarea').first().inputValue()
    expect(text).toContain('Hola Valentina')
    expect(text).toContain(ADDR4)
    expect(text).toContain('$ 650.000')
    expect(text).toContain('21 días')
    await shot(page, 'U5-reminder-dialog')
  })

  test('U6 copy to clipboard', async ({ page }) => {
    await openPanel(page)
    await page.getByRole('button', { name: 'Recordar' }).nth(1).click()
    const dlg = page.getByRole('dialog')
    const text = await dlg.locator('textarea').first().inputValue()
    await dlg.getByRole('button', { name: 'Copiar' }).click()
    await expect(page.getByText('Mensaje copiado')).toBeVisible()
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip).toBe(text)
    await shot(page, 'U6-copied')
  })

  test('U7 row 1 reminder name', async ({ page }) => {
    await openPanel(page)
    await page.getByRole('button', { name: 'Recordar' }).nth(0).click()
    const text = await page.getByRole('dialog').locator('textarea').first().inputValue()
    expect(text).toContain('Hola Lucas y Camila')
    expect(text).toContain(ADDR2)
    await shot(page, 'U7-reminder-row1')
  })

  test('U8 close dialog', async ({ page }) => {
    await openPanel(page)
    await page.getByRole('button', { name: 'Recordar' }).nth(0).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByTestId('delinquency-table')).toBeVisible()
    await shot(page, 'U8-closed')
  })

  test('U9 English', async ({ page }) => {
    await openPanel(page)
    await switchToEnglish(page)
    const card = page.getByTestId('delinquency-card')
    await expect(card).toContainText('Delinquency')
    await expect(card).toContainText('NEW')
    await expect(card).toContainText('2 tenants behind')
    await expect(card).toContainText('$ 1,490,000')
    const table = page.getByTestId('delinquency-table')
    await expect(table.locator('thead th')).toHaveText(['Tenant', 'Property', 'Delay', 'Owed', ''])
    await expect(table.locator('tbody tr').nth(0)).toContainText('Overdue · 51 days')
    await expect(table.getByRole('button', { name: 'Remind' })).toHaveCount(2)
    await table.getByRole('button', { name: 'Remind' }).nth(1).click()
    const text = await page.getByRole('dialog').locator('textarea').first().inputValue()
    expect(text.startsWith('Hi Valentina')).toBeTruthy()
    await expectAmountNotClipped(page)
    await shot(page, 'U9-english')
  })

  test('U10 Pagos shows Vencido chip', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByText('Pagos', { exact: true }).first().click()
    await page.waitForLoadState('networkidle')
    const row = page.locator('tr', { hasText: 'Valentina Rojas' }).filter({ hasText: /Vencido/ })
    await expect(row.first()).toBeVisible()
    expect(await row.count(), 'Valentina overdue rows').toBe(1)
    await expect(row.first().locator('.MuiChip-root', { hasText: 'Vencido' })).toBeVisible()
    const paidChips = page.locator('.MuiChip-root', { hasText: 'Pagado' })
    expect(await paidChips.count(), 'Pagado chips').toBeGreaterThan(0)
    await shot(page, 'U10-pagos')
    const pend = page.getByText(/Pendiente\s*\(1\)/)
    await expect(pend.first()).toBeVisible()
    await pend.first().click()
    await expect(page.locator('tr', { hasText: 'Valentina Rojas' }).first()).toBeVisible()
    await shot(page, 'U10-pagos-filter-pendiente')
  })

  test('U11 STUB empty', async ({ page }) => {
    await page.route('**/api/delinquency*', (r) =>
      r.fulfill({
        json: { asOf: '2026-10-22', totalOwed: 0, delinquentCount: 0, items: [] }
      })
    )
    await openPanel(page)
    const card = page.getByTestId('delinquency-card')
    await expect(card).toContainText('$ 0')
    await expect(card).toContainText('Sin inquilinos atrasados')
    await expect(page.getByTestId('delinquency-table')).toHaveCount(0)
    await shot(page, 'U11-stub-empty')
  })

  test('U12 STUB one item, 1 day', async ({ page }) => {
    await page.route('**/api/delinquency*', (r) =>
      r.fulfill({
        json: {
          asOf: '2026-10-22',
          totalOwed: 100000,
          delinquentCount: 1,
          items: [
            {
              leaseId: 99,
              propertyUnitId: 99,
              propertyAddress: 'Calle Falsa 123',
              tenantNames: ['Ana Perez'],
              monthlyRent: 100000,
              unpaidInstallments: 1,
              oldestDueDate: '2026-10-21',
              daysOverdue: 1,
              amountOwed: 100000
            }
          ]
        }
      })
    )
    await openPanel(page)
    await expect(page.getByTestId('delinquency-card')).toContainText('1 inquilino atrasado')
    await expect(page.getByTestId('delinquency-table')).toContainText('Vencido · 1 día')
    await page.getByRole('button', { name: 'Recordar' }).click()
    const text = await page.getByRole('dialog').locator('textarea').first().inputValue()
    await shot(page, 'U12-stub-one')
    expect(text).toContain('Hola Ana')
    expect(text).toMatch(/vencido hace 1 día[^s]/)
  })

  test('U13 STUB 500', async ({ page }) => {
    allowErrors = /Failed to load resource: the server responded with a status of 500|Error fetching delinquency: AxiosError/
    await page.route('**/api/delinquency*', (r) => r.fulfill({ status: 500, json: { message: 'boom' } }))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('delinquency-card')).toContainText('No se pudo cargar la morosidad')
    await expect(page.locator('body')).toContainText(/Total de Propiedades/)
    await expect(page.getByTestId('delinquency-table')).toHaveCount(0)
    await shot(page, 'U13-stub-500')
  })

  test('U14 narrow 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openPanel(page)
    await expect(page.getByTestId('delinquency-card')).toBeVisible()
    await expect(page.getByTestId('delinquency-table')).toBeVisible()
    const m = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      bodyScroll: document.body.scrollWidth
    }))
    expect(m.docScroll, JSON.stringify(m)).toBeLessThanOrEqual(m.docClient)
    const tableScrolls = await page
      .getByTestId('delinquency-table')
      .evaluate((t) => t.closest('.MuiTableContainer-root').scrollWidth >= t.closest('.MuiTableContainer-root').clientWidth)
    expect(tableScrolls).toBeTruthy()
    await shot(page, 'U14-390px')
  })

  test('MD 6 stat cards at 900px, nothing clipped', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await openPanel(page)
    const grid = page.locator('[data-tour="dashboard-stats"]')
    const cards = grid.locator('.MuiCard-root')
    const n = await cards.count()
    const boxes = await cards.evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width) }
      })
    )
    const tops = new Set(boxes.map((b) => b.top))
    expect(n, `cards: ${JSON.stringify(boxes)}`).toBe(6)
    console.log(`MD 900px: ${n} cards in ${tops.size} row(s): ${JSON.stringify(boxes)}`)
    expect(tops.size, `distinct row tops: ${JSON.stringify(boxes)}`).toBeLessThanOrEqual(2)
    // no clipped/overflowing text inside any stat card
    const clipped = await cards.evaluateAll((els) =>
      els.flatMap((card) =>
        [...card.querySelectorAll('h5, h6, .MuiTypography-caption')]
          .filter((e) => e.scrollWidth > e.clientWidth + 1)
          .map((e) => e.textContent)
      )
    )
    expect(clipped, 'clipped texts').toEqual([])
    const m = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
    expect(m[0]).toBeLessThanOrEqual(m[1])
    await shot(page, 'MD-900px-stats-row')
  })

  test('U15 pay the missing Oct payment, row disappears (runs last)', async ({ page, request }) => {
    const leases = await (await request.get(`${API}/leases`, { headers: authHeaders() })).json()
    const lease4 = leases.find((l) => l.id === 4)
    expect(lease4, 'lease 4').toBeTruthy()
    const before = await (await request.get(`${API}/delinquency`, { headers: authHeaders() })).json()
    expect(before.items.map((i) => i.leaseId)).toContain(4)
    // Oct payment row is PENDING (650000); register a PAID one, as the user would from Pagos.
    const res = await request.post(`${API}/payments`, {
      headers: authHeaders(),
      data: {
        leaseId: 4,
        amount: 650000,
        paymentDate: '2026-10-22',
        paymentType: 'RENT',
        status: 'PAID',
        description: 'U15 test payment'
      }
    })
    expect(res.ok(), `POST /payments ${res.status()}`).toBeTruthy()
    await openPanel(page)
    const card = page.getByTestId('delinquency-card')
    await expect(card).toContainText('$ 840.000')
    await expect(card).toContainText('1 inquilino atrasado')
    await expect(page.getByTestId('delinquency-table').locator('tbody tr')).toHaveCount(1)
    await expect(page.getByTestId('delinquency-table')).not.toContainText('Valentina Rojas')
    await shot(page, 'U15-after-payment')
  })
})
