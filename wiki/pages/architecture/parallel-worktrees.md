---
type: architecture
updated: 2026-10-20
sources: [scripts/wt.sh, scripts/lib/env.sh, scripts/seed.py, proppilot-frontend/vite.config.js, proppilot-frontend/playwright.config.js, proppilot-backend/src/main/resources/application.yml, .claude/skills/parallel-worktrees/SKILL.md]
---

# Parallel worktrees

Up to 4 extra stacks beside the main one, so parallel sessions test without sharing ports or data. Procedure: the `parallel-worktrees` skill. Context: [[harness]], [[testing]].

## Slots

| Slot | Backend | Frontend | Postgres container | Host port |
|---|---|---|---|---|
| 0 (main) | 8080 | 3000 | `proppilot-postgres` | from `.dev.env` (5434 here) |
| N (1..4) | 8080+N | 3000+N | `proppilot-pg-wtN` (volume `proppilot-pg-wtN-data`) | 5440+N |

Each slot has its own container so databases never mix (decision by Juan, replaced the first design of one shared container with a database per slot). Inside a slot container the database is still called `proppilot`. `wt.sh up` starts the container, `down` stops it (data stays in the volume), `rm` deletes container and volume. Slot 0 is never touched by `wt.sh`.

## How ports reach each piece

- `scripts/lib/env.sh` `load_dev_env` reads the worktree's `.dev.env` and exports `BACKEND_PORT`, `FRONTEND_PORT`, `DB_NAME`, `PG_CONTAINER`, `DATABASE_URL`, `PORT`. Slot 0 defaults equal the old values.
- Backend: `server.port` reads `PORT` (`application.yml:24`); the datasource reads `DATABASE_URL` (`application.yml:4`).
- Frontend: `vite.config.js` takes `FRONTEND_PORT` and `BACKEND_PORT` (dev port and `/api` proxy), with `strictPort`. Playwright and `e2e/smoke.spec.js` read the same variables.
- `scripts/seed.py --db --container` selects database and container; `--reset` truncates only that one.
- `scripts/dev-backend.sh` runs `docker compose up` only for slot 0 (the compose file fixes the container name, `proppilot-backend/docker-compose.yml:6`).

## Lean settings

- Postgres per slot: `postgres:15`, `--memory 256m`, `shared_buffers=32MB`, `max_connections=30`, `work_mem=2MB`. Measured 33 MB each (`docker stats`), versus 74 MB for the main container.
- Backend runs as the fat jar (`mvn package -DskipTests`, then `java -jar`): no Maven process, no devtools. JVM: `-Xmx512m -XX:+UseSerialGC -XX:TieredStopAtLevel=1`, Hikari pool 5.
- Vite runs directly with `--max-old-space-size=256`.
- Measured 2026-10-20 with `footprint`: about 212 MB per backend, 270-475 MB per vite while idle (up to about 900 MB while verify builds and lints in the same tree). `ps` RSS showed 30-85 MB for the same JVMs because macOS compresses pages, so do not trust it.
- `wt.sh up` refuses when `memory_pressure` free percentage is below `MIN_FREE_MEM_PCT` (15) or when `MAX_STACKS` (4) are running; `--force` skips both.
- `node_modules` is cloned with `cp -cR` from the main checkout when the lockfile matches (seconds, no extra disk on APFS).

## Evidence

Two worktrees (`wt-a` slot 1, `wt-b` slot 2, containers `proppilot-pg-wt1` :5441 and `proppilot-pg-wt2` :5442) came up in parallel, were seeded, and `wt.sh verify <name> --e2e` ran on both at once: backend tests, lint, build, smoke all PASS. The main stack kept answering on 8080 and 3000. Lowest free memory during the run: 29% (start about 36%). Both were then removed: containers and volumes gone, branches deleted.

## Gotchas

- A new worktree starts from a committed base. Harness changes that are not committed are missing there.
- Lint: Node globals for `vite.config.js`, `playwright.config.js` and `e2e/` were added to `proppilot-frontend/eslint.config.js`; the baseline dropped from 32 to 28 (`scripts/verify.sh`).
- The first `up` of a fresh host pulls nothing extra: `postgres:15` is the image the main stack already uses.
