import { expect } from '@playwright/test'

// Shared by every e2e spec (smoke.spec.js, req-*.spec.js).
export const API_BASE = `http://localhost:${process.env.BACKEND_PORT || 8080}/api`
// Must match app.local-dev.email in proppilot-backend/src/main/resources/application-local.yml
export const LOCAL_DEV_EMAIL = 'juanmgracia@gmail.com'

export const formatArs = (n) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export async function login(page) {
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

export async function apiGet(page, token, path) {
  const res = await page.request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}
