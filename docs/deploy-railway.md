# Deploy to Railway

Read-only review, 2026-10-20. Nothing was deployed. Three services in one Railway project: `Postgres`, `backend`, `frontend`.

## Services

| Service | Root dir | Build | Healthcheck |
|---|---|---|---|
| Postgres | (Railway plugin) | managed | managed |
| backend | `proppilot-backend` | `Dockerfile` (Maven + Temurin 17), `railway.json` | `/api/countries` (public, `SecurityConfig.java:33`) |
| frontend | `proppilot-frontend` | `Dockerfile` (Node 20, `serve -s dist`) | none |

## Backend env vars

`application.yml` reads these. Defaults are dev-only.

- [ ] `DATABASE_URL` must be **JDBC form**. Railway's Postgres `DATABASE_URL` is `postgresql://user:pass@host:port/db`, which Spring rejects. Use reference variables instead:
  - `DATABASE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}`
  - `DATABASE_USERNAME=${{Postgres.PGUSER}}`
  - `DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}`
- [ ] `JWT_SECRET`: random, 32+ chars. The default in `application.yml:36` is public.
- [ ] `GOOGLE_CLIENT_ID`: same client id the frontend uses. Empty means Google login fails.
- [ ] `CORS_ORIGINS`: the frontend's public URL (comma-separated if several).
- [ ] `SHOW_SQL=false` (defaults to `true`, `application.yml:10`).
- [ ] Do NOT set `SPRING_PROFILES_ACTIVE=local` (it disables auth).
- `PORT` is injected by Railway.

## Frontend env vars (build time)

Vite bakes `VITE_*` into the bundle at `npm run build`, so they must exist during the Docker build.

- [ ] `VITE_API_URL`: absolute backend URL ending in `/api`. `/api` (from `.env.production`) does not work, because `serve` has no proxy.
- [ ] `VITE_GOOGLE_CLIENT_ID`.

## Gaps to fix before relying on it

1. `proppilot-frontend/Dockerfile:6-7` hardcodes `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` with `ENV`, so Railway variables are ignored. Change to `ARG` + `ENV` from the arg.
2. `proppilot-frontend/src/config/api.js:6` hardcodes the prod backend URL for native (Capacitor) builds.
3. `proppilot-backend/Dockerfile:11` uses exec-form `CMD` with `${PORT:-8080}`. Docker does not expand variables in exec form, so Java gets the literal string and Spring resolves `${PORT:-8080}` itself (default `-8080`). It works on Railway because `PORT` is always set, but `docker run` without `PORT` likely fails. UNVERIFIED at runtime. Simplest fix: drop the `-D` flag, since `server.port: ${PORT:8080}` already handles it.
4. Schema is `ddl-auto: update` plus a hand-written `DatabaseMigrationRunner`. No Flyway/Liquibase, so no rollback story.
5. `Procfile` and `system.properties` are unused when the builder is `DOCKERFILE` (leftovers from Nixpacks).
6. No CI anywhere. Next step: a GitHub Actions workflow that runs `scripts/verify.sh` with a Postgres service container on PRs.
7. Index data (ICL/IPC) has no ingestion job, so a fresh prod DB shows no adjusted rent.

## Smoke after deploy

```bash
curl -sf https://<backend>/api/countries          # 200, public
curl -s -o /dev/null -w '%{http_code}' https://<backend>/api/property-units   # 401/403 without token
```
Then log in with Google on the frontend URL and open a lease.
