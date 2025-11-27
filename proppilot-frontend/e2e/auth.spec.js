import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should load the app successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.MuiAppBar-root')).toBeVisible({ timeout: 15000 })
  })

  test('should display user avatar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const avatar = page.locator('.MuiAvatar-root').first()
    await expect(avatar).toBeVisible({ timeout: 10000 })
  })

  test('should show user menu when avatar clicked', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const avatar = page.locator('.MuiAvatar-root').first()
    await avatar.click()

    // Menu should appear with logout option
    await expect(page.locator('.MuiMenu-root')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Navigation', () => {
  test('should have navigation sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Permanent drawer should be visible on desktop (check for drawer paper)
    const drawer = page.locator('.MuiDrawer-root .MuiDrawer-paper').first()
    await expect(drawer).toBeVisible({ timeout: 10000 })
  })

  test('should have menu items', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for list items in the drawer
    const menuItems = page.locator('.MuiListItem-root')
    await expect(menuItems.first()).toBeVisible({ timeout: 10000 })

    // Should have at least 3 menu items (Dashboard, Properties, Tenants, Payments)
    const count = await menuItems.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Mobile Responsive', () => {
  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const menuButton = page.locator('button[aria-label="open drawer"]')
    await expect(menuButton).toBeVisible({ timeout: 10000 })
  })

  test('should open drawer on mobile when hamburger is clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const menuButton = page.locator('button[aria-label="open drawer"]')
    await menuButton.click()

    // Modal drawer should appear
    const modalDrawer = page.locator('.MuiModal-root .MuiDrawer-paper')
    await expect(modalDrawer).toBeVisible({ timeout: 5000 })
  })
})
