---
type: concept
updated: 2026-10-20
sources: [raw/2026-10-20-explore-backend.md, raw/2026-10-20-explore-frontend.md, proppilot-backend/src/main/java/com/prop_pilot/service/CurrentUserService.java, proppilot-backend/src/main/resources/application-local.yml]
---

# Local dev auth (and the "empty account" gotcha)

## Production
Google Identity on the frontend sends a credential to `POST /api/auth/google`. The backend returns its own JWT. The frontend keeps it in `localStorage['token']` and sends it as `Bearer` (raw frontend report, `proppilot-frontend/src/contexts/AuthContext.jsx:26`, `:71-95`).

## Local profile (`SPRING_PROFILES_ACTIVE=local`)
- A separate security chain permits every request (`proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java:46-47`). The prod chain is `@Profile("!local")` (`:24`).
- `POST /api/auth/local` logs in with email and optional name, no password. It refuses outside the `local` profile (`proppilot-backend/src/main/java/com/prop_pilot/controller/AuthController.java:62-69`).
- The login page shows "Local Dev Mode" with quick-login buttons (Alice, Bob, Charlie) and a custom email field when running `npm run dev`.

## How the current user is picked (`CurrentUserService.java:30-59`)
1. If the request has a valid JWT, the user is the JWT's email.
2. Else, in the `local` profile, the fallback user is `app.local-dev.email` = `juanmgracia@gmail.com` (`proppilot-backend/src/main/resources/application-local.yml:7`, `CurrentUserService.java:73-86`). If that is unset, `local-dev@proppilot.local` (`:90`).

## Gotcha
`scripts/seed.py` calls the API without a token, so all seeded data belongs to `juanmgracia@gmail.com`.
- Quick-login as "Alice Test" gets a JWT for Alice, so the app shows an empty account.
- To see seeded data in the browser: use "Custom User" with email `juanmgracia@gmail.com`. Verified 2026-10-20: dashboard shows 8 properties and 5 active leases.

Related: [[owner-scoping]], [[user-owner]].
