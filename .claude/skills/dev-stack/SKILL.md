---
name: dev-stack
description: Start, stop, seed, and verify the local PropPilot stack (Postgres 5433, backend 8080, frontend 3000). Use when you need the app running or want to run the full check.
---

# Local dev stack

Read `CLAUDE.md` for gotchas first. Ports and versions live in `.dev.env`, `.sdkmanrc`, `.nvmrc`.

| Goal | Command |
| --- | --- |
| Everything up | `scripts/dev-up.sh` |
| Everything down | `scripts/dev-down.sh` |
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
