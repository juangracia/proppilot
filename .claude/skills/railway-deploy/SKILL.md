---
name: railway-deploy
description: Deploy PropPilot to Railway (backend, frontend, Postgres). Use when asked to "deploy", "put it on Railway", "set Railway variables", fix CORS or login on a deployed copy, or smoke test a deployment.
---

# Railway deploy

Detailed runbook: `docs/deploy-railway.md`. This skill is the procedure and the traps.
Railway project: `proppilot`. Env `meetup` services: `backend-meetup`, `frontend-meetup`, `Postgres-M9I-`.

## Hard rules

- Never touch the `production` environment without an explicit OK from the user.
- `railway up` only to env `meetup`. Always pass `-e meetup`.
- CLI first. Use the dashboard only for what the CLI cannot do (Google Cloud Console for OAuth origins).
- Do not push or deploy on your own. Ask first. A verifier checks the result after deploy.
- Keep the CLI current: `brew upgrade railway`, then `railway --version`. Tested on 5.71.0.
- Never print variable values (`variable list --json` and `--kv` show raw secrets).
- Official skill from Railway: `railway setup agent` (skill `use-railway`, repo `railwayapp/railway-skills`). Not installed here. Ours stays: it holds PropPilot specifics.

## CLI path for env `meetup`

Run from the repo root. Postgres service in `meetup` is `Postgres-M9I-`. Check first: `railway status` must show `Environment: meetup`.
Flags below come from `--help` on 5.71.0.

```bash
E="-e meetup"
# 1. empty services (add: "--service ... The name of the service to create"; no --environment flag, uses linked env)
railway add --service backend-meetup --json
railway add --service frontend-meetup --json
railway service list                                   # confirm both exist
# 2. domains first, so URLs are known before any build ("railway domain ... generates a Railway-provided service domain")
railway domain -s backend-meetup $E --json
railway domain -s frontend-meetup $E --json
# 3. variables (--skip-deploys: "Skip triggering deploys when setting the variable")
railway variable set -s backend-meetup $E --skip-deploys \
  'PGHOST=${{Postgres-M9I-.PGHOST}}' 'PGPORT=${{Postgres-M9I-.PGPORT}}' 'PGDATABASE=${{Postgres-M9I-.PGDATABASE}}' \
  'PGUSER=${{Postgres-M9I-.PGUSER}}' 'PGPASSWORD=${{Postgres-M9I-.PGPASSWORD}}' \
  "GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com" "CORS_ORIGINS=https://<frontend-domain>" SHOW_SQL=false
openssl rand -base64 48 | railway variable set JWT_SECRET --stdin -s backend-meetup $E --skip-deploys   # "--stdin Read the value from stdin"
railway variable set -s frontend-meetup $E --skip-deploys \
  "VITE_API_URL=https://<backend-domain>/api" "VITE_GOOGLE_CLIENT_ID=<same id>"
# 4. deploy ("-s Service to deploy to", "-e Environment to deploy to", "-c Stream build logs only, then exit")
(cd proppilot-backend  && railway up . -s backend-meetup  -e meetup --ci -m "meetup backend")
(cd proppilot-frontend && railway up . -s frontend-meetup -e meetup --ci -m "meetup frontend")
# 5. watch
railway service status; railway logs -s backend-meetup -e meetup --lines 100
```

- Use single quotes around `${{...}}` so zsh does not expand it.
- `up` help: "`railway up --detach --json` starts an upload and deployment, but it does not wait for the deployment to become healthy." `--ci` streams the build then exits. Poll with `railway deployment list --json`.
- `up` uploads the current directory. Run it inside `proppilot-backend` and `proppilot-frontend`, never the repo root.
- Build args: Dockerfile builds do not get service variables by themselves. The frontend Dockerfile declares `ARG VITE_API_URL` and `ARG VITE_GOOGLE_CLIENT_ID` (`proppilot-frontend/Dockerfile:8-9`), and Railway docs say it passes the matching service variables to declared ARGs. So set the VITE_* variables before `up`. UNVERIFIED until the first build.
- Redeploy order: if `VITE_*` changes, run `up` on the frontend again. `redeploy` help says "By default the existing build or image is redeployed as-is", so it may not rebuild with new build args. UNVERIFIED.
- After changing `CORS_ORIGINS` alone: `railway redeploy -s backend-meetup -e meetup -y`.
- Delete a service (CLI can: `service delete  Delete a service from an environment`): `railway service delete --service <name> --environment meetup --yes`. Ask first.
- The CLI cannot do: Google OAuth Authorized JavaScript origins (Google Cloud Console).
- `railway domain` on a service with no deployment yet is UNVERIFIED. If it fails, run `up` first, then `domain`, then set vars and `up` again.

## Procedure

1. Run the CLI path above.
2. Add `https://<frontend-domain>` to Google OAuth "Authorized JavaScript origins" (dashboard).
3. Run the smoke checks.
4. Ask the verifier to validate.

## Backend variables

In env `meetup` replace `Postgres` with `Postgres-M9I-`.

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
