/* global process */
import { test, expect } from '@playwright/test'

// REQ-002 browser cases B1-B11 (lanes/req-002-alertas/plan.md section 6).
// Needs the lane stack seeded: scripts/seed.sh --reset. Expected values are read from GET /api/agenda.

const EMAIL = process.env.SEED_EMAIL || 'juanmgracia@gmail.com'
const NAME = process.env.SEED_NAME || 'Juan Gracia'
const EVIDENCE = process.env.EVIDENCE_DIR
  || '/Users/juangracia/brain/10-projects/proppilot/cold-22oct/lanes/req-002-alertas/evidence'

const fmtDate = (iso) => iso.split('-').reverse().join('/')
const money = (n, lang) =>
  '$' + new Intl.NumberFormat(lang === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: 0 }).format(n)

test.describe.configure({ mode: 'serial' })

test.describe('REQ-002 agenda', () => {
  let token
  let agenda
  const byAddr = (frag) => agenda.items.find((i) => i.propertyAddress.includes(frag))
  let consoleErrors = []

  const shot = (page, name, opts = {}) =>
    page.screenshot({ path: `${EVIDENCE}/${name}.png`, fullPage: true, ...opts })

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/local', { data: { email: EMAIL, name: NAME } })
    expect(res.ok()).toBeTruthy()
    token = (await res.json()).token
    const a = await request.get('/api/agenda', { headers: { Authorization: `Bearer ${token}` } })
    expect(a.ok()).toBeTruthy()
    agenda = await a.json()
  })

  test.beforeEach(async ({ page }) => {
    consoleErrors = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
    await page.addInitScript((t) => {
      localStorage.setItem('token', t)
      localStorage.setItem('proppilot_tour_completed', 'true')
      localStorage.setItem('darkMode', 'false')
    }, token)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  const openAgenda = async (page, label = 'Agenda') => {
    await page.locator('[data-tour="nav-agenda"]:visible').click()
    await expect(page.getByTestId('agenda-table')).toBeVisible()
    await page.waitForLoadState('networkidle')
    void label
  }

  const group = (page, item) => page.getByTestId(`agenda-lease-${item.leaseId}`)

  test('B1 sidebar and API', async ({ page }) => {
    expect(agenda.counts).toEqual({ d90: 1, d60: 1, d30: 1, ended: 1 })
    const days = ['Los Álamos', 'San Juan', 'Rivadavia', 'Lavalle'].map((f) => byAddr(f).daysToEnd)
    expect(days).toEqual([20, 60, 80, -5])
    const nav = page.locator('[data-tour="nav-agenda"]:visible')
    await expect(nav).toContainText('Agenda')
    await expect(nav).toContainText('NUEVO')
    await expect(page.locator('[data-testid="agenda-badge"]:visible')).toContainText('4')
    await shot(page, 'B1-sidebar')
    expect(consoleErrors).toEqual([])
  })

  test('B2 open agenda', async ({ page }) => {
    await openAgenda(page)
    await expect(page.getByRole('heading', { name: 'Agenda de contratos' })).toBeVisible()
    const heads = (await page.locator('[data-testid="agenda-table"] thead th').allInnerTexts()).map((s) => s.trim())
    expect(heads).toEqual(['Contrato', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'])
    await expect(page.getByText('Cada contrato muestra su fin y sus ajustes. Los avisos llegan a 90, 60 y 30 días.')).toBeVisible()
    await shot(page, 'B2-agenda')
    expect(consoleErrors).toEqual([])
  })

  test('B3 rows', async ({ page }) => {
    await openAgenda(page)
    expect(agenda.items.length).toBe(9)
    for (const item of agenda.items) {
      const g = group(page, item)
      await expect(g).toBeVisible()
      await expect(g).toContainText(`base ${money(item.baseRent, 'es')}`)
      await expect(g).toContainText('Próximo ajuste')
      await expect(g).toContainText(item.tenantNames[0])
    }
    await expect(page.locator('[data-testid^="agenda-lease-"]')).toHaveCount(9)
    const txt = await page.getByTestId('agenda-table').innerText()
    expect(txt).not.toMatch(/base \$[\d.]+,\d/) // no decimals
    expect(txt).not.toContain('AR$')
    await shot(page, 'B3-rows')
  })

  test('B4 L7 Los Alamos', async ({ page }) => {
    await openAgenda(page)
    const item = byAddr('Los Álamos')
    const g = group(page, item)
    await expect(g).toContainText('Vence en 20 días')
    await expect(g).toContainText('Sin ajustes pendientes')
    const novCol = 3 // 0=Contrato, 1=Sep, 2=Oct, 3=Nov
    const endCell = g.locator('tr').first().locator('td').nth(novCol)
    await expect(endCell).toContainText(`Fin ${fmtDate(item.endDate)}`)
    const chip = g.getByText('Vence en 20 días')
    await expect(chip.locator('xpath=ancestor-or-self::*[contains(@class,"MuiChip-root")]')).toHaveClass(/MuiChip-colorError/)
    await shot(page, 'B4-L7-los-alamos')
  })

  test('B5 L8 Bv San Juan', async ({ page }) => {
    await openAgenda(page)
    const item = byAddr('San Juan')
    const g = group(page, item)
    await expect(g).toContainText('Vence en 60 días')
    await expect(g).toContainText('Sin ajuste (monto fijo)')
    const chip = g.getByText('Vence en 60 días')
    await expect(chip.locator('xpath=ancestor-or-self::*[contains(@class,"MuiChip-root")]')).toHaveClass(/MuiChip-colorWarning/)
    await shot(page, 'B5-L8-san-juan')
  })

  test('B6 L9 Rivadavia', async ({ page }) => {
    await openAgenda(page)
    const item = byAddr('Rivadavia')
    const g = group(page, item)
    await expect(g).toContainText('Vence en 80 días')
    expect(item.adjustmentDatesInWindow.length).toBeGreaterThanOrEqual(2)
    await expect(g.getByTestId('adjustment-marker')).toHaveCount(item.adjustmentDatesInWindow.length)
    // markers sit in the month column of their date
    const months = agenda.months
    for (const d of item.adjustmentDatesInWindow) {
      const col = months.indexOf(d.slice(0, 7)) + 1
      const cell = g.locator('tr').nth(1).locator('td').nth(col)
      await expect(cell).toContainText(fmtDate(d))
    }
    expect(item.nextAdjustmentDate).toBe('2026-11-01')
    expect(item.estimatedAmount).not.toBeNull()
    await expect(g).toContainText('Próximo ajuste: 01/11/2026')
    await expect(g).toContainText(`estimado ${money(item.estimatedAmount, 'es')}`)
    await shot(page, 'B6-L9-rivadavia')
  })

  test('B7 L4 Santa Fe and L1', async ({ page }) => {
    await openAgenda(page)
    const l4 = byAddr('Santa Fe 2150')
    const g4 = group(page, l4)
    await expect(g4).toContainText('Próximo ajuste: 01/03/2027')
    await expect(g4).not.toContainText('Vence')
    const l1 = agenda.items.find((i) => i.leaseId === 1)
    const g1 = group(page, l1)
    const nov = g1.locator('tr').nth(1).locator('td').nth(3)
    await expect(nov).toContainText('01/11/2026')
    await shot(page, 'B7-L4-L1')
  })

  test('B8 L10 Lavalle', async ({ page }) => {
    await openAgenda(page)
    const item = byAddr('Lavalle')
    const g = group(page, item)
    await expect(g).toContainText('Venció hace 5 días')
    const oct = g.locator('tr').first().locator('td').nth(2)
    await expect(oct).toContainText(`Fin ${fmtDate(item.endDate)}`)
    await shot(page, 'B8-L10-lavalle')
  })

  test('B9 English', async ({ page }) => {
    await page.locator('[aria-haspopup="true"]').filter({ has: page.locator('svg[data-testid="LanguageIcon"]') }).click()
    await page.getByRole('menuitem', { name: 'English' }).click()
    await openAgenda(page)
    await expect(page.getByRole('heading', { name: 'Contract calendar' })).toBeVisible()
    const heads = (await page.locator('[data-testid="agenda-table"] thead th').allInnerTexts()).map((s) => s.trim())
    expect(heads.slice(1)).toEqual(['Sep', 'Oct', 'Nov', 'Dec', 'Jan'])
    await expect(page.getByText('Ends in 20 days')).toBeVisible()
    await expect(page.getByText('Ended 5 days ago')).toBeVisible()
    await expect(group(page, byAddr('Santa Fe 2150'))).toContainText('Next adjustment: 01/03/2027')
    await expect(group(page, byAddr('Los Álamos'))).toContainText(`base ${money(byAddr('Los Álamos').baseRent, 'en')}`)
    expect(money(480000, 'en')).toBe('$480,000')
    await expect(group(page, agenda.items.find((i) => i.leaseId === 1))).toContainText('base $480,000')
    await shot(page, 'B9-english')
    expect(consoleErrors).toEqual([])
  })

  test('B10 dark mode', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('darkMode', 'true'))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await openAgenda(page)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    const m = bg.match(/\d+/g).map(Number)
    expect(m[0] + m[1] + m[2]).toBeLessThan(200) // dark background
    await expect(group(page, byAddr('Los Álamos')).getByText('Vence en 20 días')).toBeVisible()
    await shot(page, 'B10-dark')
    expect(consoleErrors).toEqual([])
  })

  test('B11 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('open drawer').click()
    await shot(page, 'B11a-drawer-375', { fullPage: false })
    await expect(page.locator('[data-tour="sidebar-nav"]:visible button')).toHaveCount(6)
    await page.locator('[data-tour="nav-agenda"]:visible').click()
    await expect(page.getByTestId('agenda-table')).toBeVisible()
    await page.waitForLoadState('networkidle')
    const m = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="agenda-table"]').closest('.MuiTableContainer-root')
      return {
        pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        boxScroll: el.scrollWidth - el.clientWidth
      }
    })
    expect(m.pageScroll).toBeLessThanOrEqual(0)
    expect(m.boxScroll).toBeGreaterThan(0)
    await shot(page, 'B11b-agenda-375', { fullPage: false })
    expect(consoleErrors).toEqual([])
  })
})
