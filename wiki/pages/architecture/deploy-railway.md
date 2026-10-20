---
type: architecture
updated: 2026-10-20
sources: [proppilot-backend/Dockerfile, proppilot-backend/railway.json, proppilot-backend/src/main/resources/application.yml, proppilot-frontend/Dockerfile, docs/deploy-railway.md, .claude/skills/railway-deploy/SKILL.md, raw/2026-10-20-railway-prep.md]
---

# Deploy (Railway)

Runbook: `docs/deploy-railway.md`. Procedure and traps: `.claude/skills/railway-deploy/SKILL.md`.

## Current state (2026-10-20)
- Both images built locally: backend 55 s, frontend 18 s. Nothing deployed yet.
- Backend image booted against local Postgres: `/api/countries` 200, `/api/property-units` 401 (no token, see [[decisions]] ADR-005).
- Railway CLI 4.11.2 is logged in as the Santex account. UNVERIFIED that it is the intended account.
- Project `proppilot` has env `production` (old live version: services `backend`, `frontend`, `Postgres`). The mobile app points at `backend-production-1752.up.railway.app`.
- Decision (ADR-006): deploy to a NEW empty env `meetup`, fresh Postgres. Never touch `production`.
- Blocked: the deploy waits for the user to run `railway link`. The auto-mode classifier denied it for the agent.

## Backend service
- `proppilot-backend/Dockerfile:12`: `CMD ["java", "-jar", "app.jar"]`. Build on `maven:3.9-eclipse-temurin-17`, run on `eclipse-temurin:17-jre`.
- `proppilot-backend/railway.json`: Dockerfile builder, health check `GET /api/countries`, timeout 300 s, restart on failure (max 10).
- `proppilot-backend/Procfile` also exists. Railway uses the Dockerfile because `railway.json` says so.
- Port: `server.port: ${PORT:8080}` (`application.yml:24`). Railway injects `PORT`. The old exec-form CMD question is gone, the CMD no longer sets a port.
- JDBC URL: `application.yml:3-6` builds `jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}` from Railway's PG* vars (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`), with local fallbacks.
- `DATABASE_URL` still overrides the composed URL (`application.yml:4`). NEVER set it to Railway's `postgresql://` reference. That value is not JDBC and wins over the PG* vars.
- `/api/countries` is public, so the health check works without auth (`proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java:33`).
- `JWT_SECRET` has an insecure dev default. Prod must set it.
- Do not set `SPRING_PROFILES_ACTIVE`. The `local` profile turns off auth.

### Backend variables (meetup)
`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` as `${{Postgres.PG*}}` references, plus `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS` (frontend domain), `SHOW_SQL=false`.

## Frontend service
- `proppilot-frontend/Dockerfile`: `node:20-alpine`, `npm ci --legacy-peer-deps`, `npm run build`, then `serve -s dist -l ${PORT:-3000}` (`:17`).
- Build ARGs `VITE_API_URL` (`:8`) and `VITE_GOOGLE_CLIENT_ID` (`:9`) are baked into the bundle. Changing either needs a redeploy (rebuild), not a restart.
- `VITE_API_URL` must be the full backend URL. `/api` does not work, because `serve` has no proxy.
- `.railwayignore` present.

## Login and OAuth
- Prod login is Google only. `/auth/local` exists only in the `local` profile ([[local-dev-auth]]).
- Add the meetup frontend domain to the Google OAuth client's Authorized JavaScript origins, or Google login fails there.

## Seeding
- `scripts/seed.py` is the seeder (see [[decisions]] ADR-003). The old `populate_database.sh` and `create_sample_data.sh` produce no leases or payments.
- Prod seed needs a token-based mode (`seed.py --token`). Planned, not built.

## Known prod URL
`https://backend-production-1752.up.railway.app/api` (`proppilot-frontend/src/config/api.js:6`). UNVERIFIED that it is still the live backend.

Related: [[backend]], [[frontend]], [[decisions]], [[open-questions]].
