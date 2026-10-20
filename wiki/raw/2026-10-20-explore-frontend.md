---
source: explore-frontend subagent
date: 2026-10-20
branch: demo/part2-cold
commit: 643d5ba
immutable: true
---

Frontend report for proppilot-frontend (read-only, nothing installed). All paths below are relative to /Users/juangracia/proppilot-meetup/proppilot/proppilot-frontend.

1. STACK (package.json)
- React 19.1, plain JS/JSX with no TypeScript. Vite 7 with @vitejs/plugin-react.
- UI: MUI 7 (material, icons), @mui/x-data-grid 8, @mui/x-date-pickers 8 with date-fns 4, Emotion. react-joyride runs the product tour.
- Tailwind 4 and @tailwindcss/forms are listed in devDeps. But no CSS file in src/ imports tailwind, and there is no postcss config, so it looks unused.
- Routing: no router. The view is a useState index (src/App.jsx:55). The menu maps 0=Dashboard, 1=Properties, 2=Tenants, 3=Leases, 4=Payments (src/App.jsx:100-105). The switch is at App.jsx:500+.
- State: React Context only. AuthContext and LanguageContext. No Redux or React Query.
- HTTP: axios, called directly inside the components. The token goes on axios.defaults (src/contexts/AuthContext.jsx:26). There are no interceptors.
- i18n: home-made. A `translations` object with es and en in src/contexts/LanguageContext.jsx:17,466 (977 lines). Currency defaults to ARS (line 15).
- Tests: Playwright e2e has one spec, e2e/visual-match.spec.js. It needs the backend on :8080 and uses /auth/local. There are no unit tests.

2. LAYOUT
- src/main.jsx wraps App in GoogleOAuthProvider.
- src/App.jsx (853 lines) holds the shell: drawer, MobileBottomNav, ProductTour and DataPortabilityDialog.
- src/components: DashboardView, PropertyUnitsList (1376 lines), TenantsList (1175), LeaseForm (1961), PaymentForm (1116), LoginPage, MoneyInput, PullToRefresh, LanguageCurrencySelector.
- PropertyUnitsListOld.jsx is dead code. No other file imports it.
- Other folders: src/hooks (useCountries, usePullToRefresh) and src/config/api.js.

3. BACKEND CONNECTION
- src/config/api.js:3-10: a native app always uses the hardcoded https://backend-production-1752.up.railway.app/api. The web uses VITE_API_URL, or '/api' if it is not set.
- Dev proxy: vite.config.js sends /api to http://localhost:8080. The dev server runs on port 3000.
- Env vars: VITE_GOOGLE_CLIENT_ID (.env.local.example) and VITE_API_URL (.env.production = /api).
- Auth: Google Identity sends a credential to POST /auth/google, and the backend returns its own JWT. The JWT is stored in localStorage 'token' and sent as a Bearer header. GET /auth/me loads the user (AuthContext.jsx:71-95).
- Dev mode (import.meta.env.DEV on web) shows quick-login buttons. They call POST /auth/local with email and name only, with no password (AuthContext.jsx:51, LoginPage.jsx:104).
- Native login uses @codetrix-studio/capacitor-google-auth and sends its idToken to the same /auth/google.

4. MOBILE
- Capacitor 7. appId is com.proppilot.app and webDir is dist (capacitor.config.json). vite base is './'.
- The ios/ and android/ projects are committed. A debug APK (4.8MB) is in the repo root.
- Android needs Java 21 (MOBILE_APPS.md).
- Scripts: `npm run cap:ios` and `npm run cap:android` (they build, sync, then open the IDE).

5. COMMANDS (run inside proppilot-frontend)
- Node: README says 18+. Dockerfile uses node:20-alpine. There is no .nvmrc.
- Install: `npm ci --legacy-peer-deps`. Dockerfile line 4 needs this flag, which means there are peer-dep conflicts.
- Dev: `npm run dev` (port 3000, needs the backend on :8080). Another option: ./start-frontend.sh.
- Build: `npm run build`. Lint: `npm run lint`. E2E: `npm run test:e2e`. Preview: `npm run preview`.

6. DEPLOY
- Railway. The Dockerfile has 2 stages and runs `serve -s dist` on $PORT. .railwayignore is also present.
- The Dockerfile hardcodes VITE_API_URL to the Railway backend and also hardcodes the Google client ID.
- There is no Vercel or Netlify config.

7. RISKS
- The prod backend URL is hardcoded in 2 places (api.js:6 and Dockerfile:6). Because of this, native builds cannot point at staging or local.
- The JWT is in localStorage, so it is open to XSS. /auth/local takes no password. Its safety depends only on the backend turning it off in prod. Check this with explore-backend.
- The components are very large (1-2k lines) and call axios inline. There is no API layer and no 401 interceptor (a 401 only triggers logout through /auth/me).
- A binary APK and dead code (PropertyUnitsListOld.jsx, unused Tailwind) are committed. The --legacy-peer-deps flag hides dependency conflicts.
- Test coverage is close to zero: one visual Playwright spec and no unit tests.
