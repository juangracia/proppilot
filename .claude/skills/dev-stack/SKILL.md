---
name: dev-stack
description: Start, stop, seed, and verify the local PropPilot stack (Postgres 5433, backend 8080, frontend 3000). Use when you need the app running or want to run the full check.
---

# Local dev stack

Read `CLAUDE.md` for gotchas first. Ports and versions live in `.dev.env`, `.sdkmanrc`, `.nvmrc`.

| Goal | Command |
| --- | --- |
| Everything up | `scripts/dev-up.sh` (`--seed` loads demo data) |
| Stop backend and frontend | `scripts/dev-down.sh` (only pids in `.dev/`; `--db` also stops a DB it started) |
| Only DB / backend / frontend | `scripts/dev-db.sh`, `scripts/dev-backend.sh`, `scripts/dev-frontend.sh` |
| Demo data (synthetic) | `scripts/seed.sh` |
| Full check | `scripts/verify.sh` |

## Steps

1. Run `scripts/dev-up.sh`. Wait until it says the backend and frontend answer.
2. Check `curl -s localhost:8080/api/countries` returns JSON, and `http://localhost:3000` loads.
3. Run `scripts/seed.sh` if the DB is empty.
4. Run `scripts/verify.sh` before you claim a change is done.
5. Run `scripts/dev-down.sh` when finished.

## If it fails

- Port in use: another container holds 5433, 8080 or 3000. Find it with `lsof -i :<port>` or `docker ps`. Stop the other one, or change `.dev.env`.
- Wrong Java: the shell default may be 25. The scripts set JDK 17. If you run `mvn` by hand, set `JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem`.
- `npm ci` fails with ERESOLVE: use `npm ci --legacy-peer-deps`.
- 9 backend tests error: the DB is down. Start it with `scripts/dev-db.sh`.
- `DataPortabilityControllerTest#exportAll_Unauthenticated_ShouldReturn401` fails even with the DB up. It is a known failure (`scripts/baselines/backend-known-failures.txt`).
- The DB is compose project `proppilot-cold`. Never touch the older volume `proppilot-backend_postgres_data`.
- Playwright rewrites the tracked `proppilot-frontend/playwright-report/index.html`: `git checkout` it before committing.
- `verify.sh` stages: stack up + seed, backend tests vs known failures, frontend build, lint vs baseline (32), Playwright smoke only (`visual-match.spec.js` fails on HEAD).
