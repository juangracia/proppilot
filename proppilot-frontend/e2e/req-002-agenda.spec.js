import { test, expect } from '@playwright/test'
import { login, apiGet } from './helpers'

// REQ-002: Agenda view and dashboard summary, checked against GET /api/agenda (data from scripts/seed.py).

const ISO_TO_ES = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

test('agenda view shows the next adjustment and the expired-not-renewed lease', async ({ page }) => {
  const token = await login(page)
  const agenda = await apiGet(page, token, '/agenda?days=365')

  // Non-empty data first, so the UI assertions below cannot pass on an empty account.
  const adjustment = agenda.events.find((e) => e.type === 'ADJUSTMENT' && e.propertyAddress.includes('Av. Santa Fe 2450'))
  expect(adjustment, 'ADJUSTMENT event for Av. Santa Fe 2450').toBeTruthy()
  expect(agenda.summary.expiredNotRenewed).toBeGreaterThanOrEqual(1)

  await page.getByRole('button', { name: 'Agenda' }).first().click()
  await expect(page.getByTestId('agenda-view')).toBeVisible()
  await expect(page.getByRole('banner')).toContainText('Agenda de contratos')

  const adjRow = page.locator(`[data-testid="agenda-row"][data-type="ADJUSTMENT"][data-lease-id="${adjustment.leaseId}"]`).first()
  await expect(adjRow).toContainText(`Próximo ajuste: ${ISO_TO_ES(adjustment.date)}`)
  await expect(adjRow.getByTestId('agenda-base')).toContainText('base')

  const expired = agenda.events.find((e) => e.alertLevel === 'EXPIRED')
  const expiredRow = page.locator(`[data-testid="agenda-row-expired"][data-lease-id="${expired.leaseId}"]`)
  await expect(expiredRow).toBeVisible()
  await expect(expiredRow).toContainText('Vencido sin renovar')
})

test('dashboard summary matches the API and the old purple card is gone', async ({ page }) => {
  const token = await login(page)
  const agenda = await apiGet(page, token, '/agenda?days=90')
  expect(agenda.events.length).toBeGreaterThan(0)
  const { expiringWithin90, adjustmentsThisMonth, expiredNotRenewed } = agenda.summary

  // Seed-known values (scripts/seed.py: one expired-not-renewed lease, one ending within 90 days), so a wrong summary cannot pass.
  expect(expiredNotRenewed).toBe(1)
  expect(expiringWithin90).toBeGreaterThanOrEqual(1)

  const card = page.getByTestId('agenda-summary-card')
  const plural = (n, one, many) => (n === 1 ? one : many.replace('{n}', n))
  await expect(card).toContainText(
    [
      plural(expiringWithin90, '1 contrato vence en menos de 90 días', '{n} contratos vencen en menos de 90 días'),
      plural(adjustmentsThisMonth, '1 ajuste este mes', '{n} ajustes este mes'),
      plural(expiredNotRenewed, '1 vencido sin renovar', '{n} vencidos sin renovar')
    ].join(', ')
  )
  await expect(page.getByText('Contratos por Vencer', { exact: true })).toHaveCount(0)
})

test('selected menu item is highlighted', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: 'Agenda' }).first().click()
  const item = page.locator('[data-tour="nav-agenda"]:visible')
  await expect(item).toHaveClass(/Mui-selected/)
  await expect(item).toHaveCSS('border-left-width', '3px')
})
