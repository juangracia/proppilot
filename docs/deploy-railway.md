# Deploy to Railway

Runbook. One Railway project, three services: `Postgres`, `backend`, `frontend`.
Both images were built and the backend image was booted against Postgres locally on 2026-10-20. Nothing was deployed.

Note: `backend-production-1752.up.railway.app` (still hardcoded for native builds in `proppilot-frontend/src/config/api.js:6`) may be a previous deployment. UNVERIFIED.

## Target and script (production)

Juan decided on 2026-10-20: deploy to Railway env `production` (project `4bb03a0f-05c3-4f48-ba7f-6c6a7afdcd43`). Frontend `https://www.proppilot.live`, backend `https://backend-production-1752.up.railway.app`.
The services are not linked to GitHub. Only `railway up` deploys, so a merge to `main` changes nothing in prod.

```bash
scripts/deploy-prod.sh --dry-run   # first, always
scripts/deploy-prod.sh             # verify --e2e, backup, variables, deploy, smoke
```

Order inside the script: clean tree and green verify, `pg_dump` backup to `~/brain/10-projects/proppilot/backups/prod-<timestamp>.sql.gz`, variable fixes with `--skip-deploys`, `railway up` backend then frontend, smoke checks.
Restore a backup: `gunzip -c <file> | psql "$DATABASE_PUBLIC_URL"` (the dump uses `--clean --if-exists`).
Env `meetup` (`backend-meetup`, `frontend-meetup`, `Postgres-M9I-`, `Postgres-SDcD`) is unused. Delete it only with Juan's OK.

## 0. CLI path for a new env (reference)

The commands for env `meetup` live in `.claude/skills/railway-deploy/SKILL.md`. Summary: `railway add --service <name>`, `railway domain -s <name> -e meetup`, `railway variable set ... --skip-deploys`, then `railway up . -s <name> -e meetup --ci` from each service folder. CLI tested on 5.71.0. Only the Google OAuth origin needs a browser. Sections 1 to 4 below are the dashboard equivalent.

## 1. Project and database

1. Railway dashboard: New Project, Empty Project.
2. `+ Create`, Database, PostgreSQL. Keep the service name `Postgres` (the references below use it).

## 2. Backend service

1. `+ Create`, GitHub Repo, this repo. Rename the service to `backend`.
2. Settings, Source, Root Directory: `proppilot-backend`. Railway then picks up `proppilot-backend/railway.json` (Dockerfile build, healthcheck `/api/countries`).
3. Variables (Raw Editor):

```
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<paste output of: openssl rand -base64 48>
GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
CORS_ORIGINS=https://<frontend-domain>
SHOW_SQL=false
```

- `application.yml` builds `jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}` from these. No `DATABASE_URL` needed.
- Do NOT set `DATABASE_URL=${{Postgres.DATABASE_URL}}`. That value is `postgresql://...`, not JDBC, and it overrides the PG* vars.
- Do NOT set `SPRING_PROFILES_ACTIVE`. The `local` profile turns off auth.
- `PORT` is injected by Railway. `server.port: ${PORT:8080}` reads it.
- `CORS_ORIGINS` needs the frontend domain from step 4. Set a placeholder now, fix it after.

## 3. Frontend service

1. `+ Create`, GitHub Repo, same repo. Rename to `frontend`.
2. Root Directory: `proppilot-frontend`. Builder: Dockerfile (auto-detected).
3. Variables:

```
VITE_API_URL=https://<backend-domain>/api
VITE_GOOGLE_CLIENT_ID=<same id as GOOGLE_CLIENT_ID>
```

- Vite bakes these into the bundle at build time. The Dockerfile declares them as `ARG`, so Railway passes them in.
- `VITE_API_URL` must be the full backend URL. `/api` does not work, because `serve` has no proxy.
- Changing them needs a redeploy (rebuild), not a restart.

## 4. Domains

1. `backend`, Settings, Networking, Generate Domain.
2. `frontend`, same.
3. Put the frontend domain in backend `CORS_ORIGINS`. Put the backend domain in frontend `VITE_API_URL`. Redeploy both.

## 5. Google OAuth

- Google Cloud Console, Credentials, the OAuth client: add `https://<frontend-domain>` to Authorized JavaScript origins.
- `POST /api/auth/local` returns 403 outside the `local` profile (`AuthController.java:69`). In prod, login is Google only.

## 6. Smoke checks

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<backend-domain>/api/countries        # 200 (public)
curl -s -o /dev/null -w '%{http_code}\n' https://<backend-domain>/api/property-units   # 401 (no token)
```

Then open `https://<frontend-domain>`, log in with Google, open a lease.

## Local proof (2026-10-20)

```bash
docker build -t proppilot-backend:railway-test proppilot-backend
docker build --build-arg VITE_API_URL=https://example-backend.up.railway.app/api \
  --build-arg VITE_GOOGLE_CLIENT_ID=test-client-id -t proppilot-frontend:railway-test proppilot-frontend
docker run --rm -e PGHOST=host.docker.internal -e PGPORT=5434 -e PGDATABASE=proppilot \
  -e PGUSER=proppilot -e PGPASSWORD=proppilot123 -e PORT=8090 -p 8090:8090 proppilot-backend:railway-test
```

Result: Tomcat on 8090, `/api/countries` 200, `/api/property-units` 401. Without `PORT` it starts on 8080.

## Known gaps (not blocking deploy)

1. `proppilot-frontend/src/config/api.js:6` hardcodes the old backend URL for native (Capacitor) builds. Web builds use `VITE_API_URL`.
2. Schema is `ddl-auto: update` plus `DatabaseMigrationRunner`. No Flyway/Liquibase, no rollback.
3. `Procfile` and `system.properties` are unused with the Dockerfile builder.
4. No CI. Next step: GitHub Actions running `scripts/verify.sh` with a Postgres service.
5. No ICL/IPC index ingestion, so a fresh prod DB shows no adjusted rent.
