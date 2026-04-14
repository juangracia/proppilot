import { test, expect } from '@playwright/test';

test.describe('Adjusted Rent Card', () => {
  test.setTimeout(300000); // 5 minutes to allow for manual login

  test('shows adjusted rent info in lease detail dialog', async ({ page }) => {
    await page.goto('https://www.proppilot.live');

    console.log('Please log in with Google. Waiting up to 2 minutes...');

    // Wait for login - any authenticated dashboard content
    await page.waitForFunction(() => {
      const body = document.body.innerText;
      return (
        body.includes('Dashboard') ||
        body.includes('Propiedades') ||
        body.includes('Contratos') ||
        body.includes('ICL') ||
        body.includes('IPC')
      );
    }, { timeout: 120000 }).catch(() => {
      console.log('Login detection timed out, continuing anyway...');
    });

    await page.waitForTimeout(2000);

    // Navigate to Leases (Contratos)
    console.log('Navigating to Contratos (Leases)...');
    const leasesNav = page.locator('text=Contratos').first();
    await leasesNav.click();
    await page.waitForTimeout(2000);

    // Click the first lease in the list to open the detail dialog
    console.log('Opening first lease detail...');
    const firstLease = page.locator('[role="row"]:not([role="columnheader"]), .MuiTableRow-root:not(.MuiTableRow-head), .MuiListItem-root').first();
    await firstLease.click();
    await page.waitForTimeout(2000);

    // The AdjustedRentCard section header is always rendered
    console.log('Asserting AdjustedRentCard is visible...');
    const cardHeader = page.locator('text=Alquiler Ajustado').first();
    await expect(cardHeader).toBeVisible({ timeout: 10000 });

    // The card either shows index data or the "no data" fallback - both are valid
    const hasAdjustedRentData = await page.locator('text=Monto Ajustado').isVisible().catch(() => false);
    const hasNoIndexFallback = await page.locator('text=Sin datos de indice disponibles').isVisible().catch(() => false);

    if (hasAdjustedRentData) {
      console.log('Lease has adjustment index data - verifying monetary value...');

      // Monto Ajustado label is visible
      await expect(page.locator('text=Monto Ajustado')).toBeVisible();

      // Alquiler Base label is visible
      await expect(page.locator('text=Alquiler Base')).toBeVisible();

      // Indice de Ajuste label is visible
      await expect(page.locator('text=Indice de Ajuste')).toBeVisible();

      // Factor de Ajuste label is visible
      await expect(page.locator('text=Factor de Ajuste')).toBeVisible();

      // The adjusted amount should not be empty - look for a currency-formatted value ($ sign)
      const adjustedAmount = page.locator('text=Monto Ajustado').locator('..').locator('h6, [class*="h6"]').first();
      const amountText = await adjustedAmount.textContent().catch(() => '');
      console.log(`Adjusted rent value: ${amountText}`);
      expect(amountText?.trim().length).toBeGreaterThan(0);

      console.log('Adjusted rent card is showing full data.');
    } else if (hasNoIndexFallback) {
      console.log('Lease has no adjustment index - fallback message is shown correctly.');
      await expect(page.locator('text=Sin datos de indice disponibles')).toBeVisible();
    } else {
      // Neither state found yet - card may still be loading, wait a bit more
      console.log('Waiting for card to finish loading...');
      await page.waitForTimeout(3000);

      const finalHasData = await page.locator('text=Monto Ajustado').isVisible().catch(() => false);
      const finalHasFallback = await page.locator('text=Sin datos de indice disponibles').isVisible().catch(() => false);

      expect(finalHasData || finalHasFallback).toBeTruthy();
    }

    await page.screenshot({ path: 'e2e/screenshots/adjusted-rent-card.png', fullPage: false });
    console.log('Screenshot saved to e2e/screenshots/adjusted-rent-card.png');
  });
});
