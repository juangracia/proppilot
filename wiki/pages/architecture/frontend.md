---
type: architecture
updated: 2026-10-20
sources: [raw/2026-10-20-explore-frontend.md, proppilot-frontend/package.json]
---

# Frontend (proppilot-frontend)

## Stack
- React 19, Vite 7, plain JavaScript (no TypeScript).
- MUI 7 with data grid and date pickers (date-fns). react-joyride for the product tour.
- Tailwind 4 is in devDependencies but looks unused (raw frontend report).
- Capacitor 7 for iOS and Android (`proppilot-frontend/capacitor.config.json`, `MOBILE_APPS.md`).

## Structure
- No router. `useState` index in `proppilot-frontend/src/App.jsx:55` picks the view: 0 dashboard, 1 properties, 2 tenants, 3 leases, 4 payments.
- State: `AuthContext` and `LanguageContext` only.
- HTTP: axios directly in components. No API layer, no 401 interceptor.
- i18n: home-made `translations` (es, en) in `proppilot-frontend/src/contexts/LanguageContext.jsx`. Default Spanish, currency ARS.
- Big components: `LeaseForm.jsx` (~1961 lines), `PropertyUnitsList.jsx` (~1376), `TenantsList.jsx` (~1175), `PaymentForm.jsx` (~1116). `PropertyUnitsListOld.jsx` is dead code.
- `DashboardView.jsx` computes the stat cards in the browser from the lists. See [[open-questions]] for the tenant count.

## Backend connection
- Web: `VITE_API_URL` or `/api`. Vite dev proxy sends `/api` to `http://localhost:8080`. Dev server on port 3000.
- Native apps: hardcoded prod URL in `proppilot-frontend/src/config/api.js:6`.
- Auth: see [[local-dev-auth]].

## Commands (in `proppilot-frontend/`)
`npm ci --legacy-peer-deps`, `npm run dev`, `npm run build`, `npm run lint`, `npm run test:e2e` (Playwright, one spec `e2e/visual-match.spec.js`).

Related: [[backend]], [[deploy-railway]].
