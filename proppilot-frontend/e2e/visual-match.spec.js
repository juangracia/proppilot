import { test, expect } from '@playwright/test'

const API_BASE = 'http://localhost:8080/api'
const DEMO_EMAIL = 'demo@proppilot.ar'
const DEMO_NAME = 'Demo User'

/**
 * Get a JWT token for the demo user and inject it into localStorage.
 * The app reads the token from localStorage on load and sets it as
 * the Axios Authorization header.
 */
async function loginAsDemo(page) {
  const res = await page.request.post(`${API_BASE}/auth/local`, {
    data: { email: DEMO_EMAIL, name: DEMO_NAME }
  })
  const { token } = await res.json()

  // Set the token before navigating so AuthContext picks it up
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
    // Dismiss the product tour so it does not obscure screenshots
    localStorage.setItem('proppilot_tour_completed', 'true')
  }, token)
}

/**
 * Find the first lease with adjustmentIndex === 'ICL' and status === 'ACTIVE'
 * by calling the backend API directly using the injected token.
 */
async function getIclActiveLease(page) {
  const res = await page.request.get(`${API_BASE}/leases`)
  const leases = await res.json()
  return leases.find(
    (l) => l.adjustmentIndex === 'ICL' && l.status === 'ACTIVE'
  )
}

test.describe('visual-match screenshots', () => {
  test('capture-lease-detail', async ({ page }) => {
    // Step 1: authenticate
    await loginAsDemo(page)

    // Step 2: navigate to root so the app boots with the token in place
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 3: find ICL active lease via API (reuses the authenticated browser context)
    const lease = await getIclActiveLease(page)
    expect(lease, 'Expected at least one ICL ACTIVE lease').toBeTruthy()

    // Step 4: click the "Contratos" sidebar nav item (value=3)
    // The sidebar renders ListItem buttons whose text matches the menu label
    await page.getByRole('button', { name: /contratos/i }).first().click()
    await page.waitForLoadState('networkidle')

    // Step 5: the default statusFilter is 'ACTIVE', so the ICL lease should be visible.
    // Find the row that contains the lease's property address and click it to open the dialog.
    // The address is "Obispo Trejo 560..." — use a partial match on the tenant or address.
    const leaseRow = page.getByRole('row').filter({ hasText: lease.propertyAddress.split(',')[0] })
    await expect(leaseRow).toBeVisible({ timeout: 10000 })
    await leaseRow.click()

    // Step 6: wait for the dialog to appear
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // Step 7: wait for the "Alquiler ajustado a hoy" section to render
    // (this means the /adjusted-rent fetch has completed and hasAdjustment=true)
    await expect(
      dialog.getByText(/alquiler ajustado a hoy/i)
    ).toBeVisible({ timeout: 15000 })

    // Step 8: screenshot the Paper (white container) to avoid backdrop bleed-through.
    // The text visibility check above already confirms adjusted-rent data has loaded.
    // Use page.screenshot with clip so Playwright composites the full page (incl. dialog)
    // and clips to the Paper's bounding box, avoiding the transparent-backdrop issue.
    const dialogPaper = page.locator('.MuiDialog-paper').first()
    await expect(dialogPaper).toBeVisible({ timeout: 5000 })
    const box = await dialogPaper.boundingBox()
    await page.screenshot({
      path: 'test-results/visual-match/lease-detail.actual.png',
      clip: { x: box.x, y: box.y, width: box.width, height: box.height }
    })
  })

  test('capture-payment-form', async ({ page }) => {
    // Step 1: authenticate
    await loginAsDemo(page)

    // Step 2: navigate to root so the app boots with the token in place
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Step 3: find ICL active lease via API
    const lease = await getIclActiveLease(page)
    expect(lease, 'Expected at least one ICL ACTIVE lease').toBeTruthy()

    // Step 4: click the "Pagos" sidebar nav item (value=4)
    await page.getByRole('button', { name: /pagos/i }).first().click()
    await page.waitForLoadState('networkidle')

    // Step 5: click the "Registrar Pago" tab (tab index 1)
    const registerTab = page.getByRole('tab', { name: /registrar pago/i })
    await expect(registerTab).toBeVisible({ timeout: 10000 })
    await registerTab.click()

    // Step 6: wait for the lease dropdown to appear and select the ICL lease.
    // MUI Select renders as div[role="combobox"]. There are 2 comboboxes on the form
    // (lease selector + payment type). The lease one has no selected value initially.
    // Use the aria-labelledby or just pick the first combobox (lease selector).
    const addressFragment = lease.propertyAddress.split(',')[0]

    // Wait for the form to be fully rendered (leases loaded) - use first combobox
    const leaseCombobox = page.getByRole('combobox').first()
    await expect(leaseCombobox).toBeVisible({ timeout: 10000 })
    await leaseCombobox.click()

    // The dropdown option contains the property address and tenant name
    const option = page.getByRole('option').filter({ hasText: addressFragment })
    await expect(option).toBeVisible({ timeout: 10000 })
    await option.click()

    // Wait for the dropdown to close (listbox disappears)
    await expect(page.getByRole('listbox')).toBeHidden({ timeout: 5000 })

    // Step 7: wait for the PRE-LLENO chip to appear (means /adjusted-rent resolved
    // and the amount was pre-filled with the adjusted value).
    // The chip text renders in a span inside the label — use .first() to avoid strict mode.
    await expect(
      page.getByText(/pre-lleno/i).first()
    ).toBeVisible({ timeout: 15000 })

    // Step 8: screenshot the full page
    await page.screenshot({
      path: 'test-results/visual-match/payment-form.actual.png',
      fullPage: true
    })
  })
})
