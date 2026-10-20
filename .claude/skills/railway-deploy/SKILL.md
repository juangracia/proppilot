---
name: railway-deploy
description: Deploy PropPilot to Railway (backend, frontend, Postgres). Use when asked to "deploy", "put it on Railway", "set Railway variables", fix CORS or login on a deployed copy, or smoke test a deployment.
---

# Railway deploy

Detailed runbook: `docs/deploy-railway.md`. This skill is the procedure and the traps.
Railway project: `proppilot`. Services: `backend`, `frontend`, `Postgres`.

## Hard rules

- Never touch the `production` environment without an explicit OK from the user.
- Prefer a separate environment (for example `meetup`).
- Do not push or deploy on your own. Ask first.

## Procedure

1. Create or pick the environment. Keep the Postgres service named `Postgres`.
2. `backend`: Root Directory `proppilot-backend` (uses `railway.json`, healthcheck `/api/countries`).
3. `frontend`: Root Directory `proppilot-frontend` (Dockerfile).
4. Generate a domain for both services.
5. Cross-fill the two URLs:
   - backend `CORS_ORIGINS=https://<frontend-domain>`
   - frontend `VITE_API_URL=https://<backend-domain>/api`
6. Redeploy the frontend after any `VITE_*` change.
7. Add `https://<frontend-domain>` to Google OAuth "Authorized JavaScript origins".
8. Run the smoke checks.

## Backend variables

```
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<output of: openssl rand -base64 48>
GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
CORS_ORIGINS=https://<frontend-domain>
SHOW_SQL=false
```

Frontend: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` (same id as the backend).

## Traps

- Never set `DATABASE_URL` to Railway's `postgres://` URL. It is not JDBC and it overrides the PG* vars. The backend builds the JDBC URL from PG*.
- Never set `SPRING_PROFILES_ACTIVE=local`. It turns auth off.
- `VITE_API_URL` is baked in at build time. Changing it needs a rebuild, not a restart.
- `VITE_API_URL` must be the full backend URL plus `/api`. The frontend server has no proxy.
- `POST /api/auth/local` only works in profile `local`. In prod, login is Google only.
- CORS error in the browser: `CORS_ORIGINS` does not match the frontend domain exactly (scheme, no trailing slash).
- `proppilot-frontend/src/config/api.js:6` hardcodes an old backend URL for native builds only.

## Smoke checks

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<backend-domain>/api/countries       # 200
curl -s -o /dev/null -w '%{http_code}\n' https://<backend-domain>/api/property-units  # 401 without token
```

Then open `https://<frontend-domain>`, log in with Google, open a lease.

## Report back

Say which environment you used, the two domains, and the result of each smoke check.
