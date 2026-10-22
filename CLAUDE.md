# PropPilot

Property rental manager for Argentina. Owners manage properties, tenants, leases and payments. Spring Boot API plus React SPA (also packaged with Capacitor for mobile).

## Commands

All scripts read ports from `.dev.env` (DB 5433, backend 8080, frontend 3000). Toolchain pins: `.sdkmanrc` (java 17.0.15-tem), `.nvmrc` (node 24).

| Task | Command |
| --- | --- |
| Start DB, backend, frontend | `scripts/dev-up.sh` (add `--seed` to load demo data) |
| Stop backend and frontend | `scripts/dev-down.sh` (stops only pids in `.dev/`; add `--db` to stop the DB it started) |
| Single parts | `scripts/dev-db.sh`, `scripts/dev-backend.sh`, `scripts/dev-frontend.sh` |
| Load demo data (synthetic) | `scripts/seed.sh` |
| Full check (the definition of done) | `scripts/verify.sh` |
| Smoke test only | `cd proppilot-frontend && npx playwright test e2e/smoke.spec.js` |

`scripts/verify.sh` stages, in order, then a summary table (exit non-zero if any stage fails):
1. stack up + seed
2. backend tests vs `scripts/baselines/backend-known-failures.txt`
3. frontend build
4. lint vs baseline (`scripts/baselines/lint-problems.txt`, currently 32; `--update-baseline` rewrites it, only on purpose)
5. Playwright, `e2e/smoke.spec.js` only (`playwright.config.js` reads `FRONTEND_PORT`)

## Run a second stack (worktree per feature)

Another checkout can run next to this one. Give it its own ports, compose project and DB container. All five vars live in `.dev.env` and can be set from the shell:

| Var | Default |
| --- | --- |
| `DB_PORT` | 5433 |
| `BACKEND_PORT` | 8080 |
| `FRONTEND_PORT` | 3000 |
| `COMPOSE_PROJECT` | `proppilot-cold` |
| `PG_CONTAINER` | `proppilot-postgres` |

```
DB_PORT=5434 BACKEND_PORT=8081 FRONTEND_PORT=3001 \
COMPOSE_PROJECT=proppilot-fresh2 PG_CONTAINER=proppilot-postgres-fresh2 scripts/verify.sh
scripts/dev-down.sh --db    # teardown, with the same vars set
```

- `dev-db.sh` refuses a container that belongs to another compose project.
- `dev-backend.sh` and `dev-frontend.sh` stop with "port ... is taken ... set BACKEND_PORT / FRONTEND_PORT" if a foreign process holds the port.
- `verify.sh` and the backend script pass `DATABASE_URL` built from `DB_PORT`. `vite.config.js` reads `FRONTEND_PORT` and `BACKEND_PORT`. Compose maps `${DB_PORT:-5433}:5432`.

## Gotchas

- Java: the shell default may be 25. The project needs JDK 17. Use `JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem mvn ...` inline. The scripts already do this.
- No `mvnw`. Use system `mvn`.
- Frontend install: `npm ci` fails (peer conflict, capacitor-google-auth vs core). Use `npm ci --legacy-peer-deps`.
- Postgres runs on host port **5433** (not 5432). Compose file: `proppilot-backend/docker-compose.yml`. Db, user `proppilot`, password `proppilot123`.
- Run the backend with `SPRING_PROFILES_ACTIVE=local`. That profile permits all requests and uses a dev user (`app.local-dev.email`). See `SecurityConfig.java:46`.
- Some backend tests (`AuthControllerTest`, `DataPortabilityControllerTest`) are `@SpringBootTest` and need Postgres on 5433. Without it, 9 of 37 fail. Start the DB first.
- One known failing test remains with the DB up: `DataPortabilityControllerTest#exportAll_Unauthenticated_ShouldReturn401` (profile local has no 401). It is listed in `scripts/baselines/backend-known-failures.txt`. Any other failure is new.
- Compose project name is `proppilot-cold` (own volume). An older volume `proppilot-backend_postgres_data` holds other data. Do not touch it.
- `e2e/visual-match.spec.js` fails on HEAD (it expects `demo@proppilot.ar` data), so `verify.sh` runs the smoke spec only.
- Playwright's default html reporter rewrites the tracked `proppilot-frontend/playwright-report/index.html`. Run `git checkout proppilot-frontend/playwright-report/index.html` before you commit.
- No Flyway. Schema comes from `ddl-auto: update` plus raw ALTERs in `config/DatabaseMigrationRunner.java`.
- `npm run lint` exits non-zero on HEAD. `verify.sh` compares the problem count to the baseline file (32).
- `index_values` is empty on a fresh DB, so adjusted rent shows no adjustment. `seed.sh` adds index rows tagged `source='SYNTHETIC'` (invented, not real INDEC data). Seeded lease 1 (ICL, 480000) shows 778992 adjusted.
- `src/config/api.js:6` hardcodes a Railway URL for native builds. Do not "fix" it without being asked.

## Rules

- Every new UI string goes in both `es` and `en` in `proppilot-frontend/src/contexts/LanguageContext.jsx`.
- Backend errors go through `GlobalExceptionHandler`: throw `ResourceNotFoundException` (404), `ValidationException` (400) or `BusinessLogicException` (422). Do not return ad hoc error bodies.
- Scope every query by owner (`ownerId` from `CurrentUserService`). Never read another owner's rows.
- Do not mass-fix lint. Fix only lint in files you touch, and keep the baseline from growing.
- Do not edit `PropertyUnitsListOld.jsx` (dead code). Do not split `LeaseForm.jsx` as a side effect.
- Frontend is JSX, no TypeScript, no router (`App.jsx` uses `selectedView`), axios called from components.
- Never push to `main` or `master`. Never run `railway up` or deploy unless Juan says so.
- Commits: small, one logical change each. No AI attribution lines.

## Domain invariants

Details and more rules: `wiki/pages/business-rules.md`.

- A lease needs at least one tenant, `end > start`, and at least 30 days (`LeaseServiceImpl.java:57`, `:85`, `:90`).
- Only one ACTIVE, non-deleted lease may overlap a property in time (`LeaseRepository.java:101`).
- Only a TERMINATED lease can be reactivated (`LeaseServiceImpl.java:244`). A lease with payments cannot be hard deleted (`:268`).
- Payment date is not before lease start and not in the future. Amount is at most 3x monthly rent (`PaymentServiceImpl.java:54`, `:60`; `Payment.java:42`).
- A tenant or property with non-deleted leases cannot be deleted (`TenantServiceImpl.java:96`, `PropertyUnitServiceImpl.java:75`).
- Adjusted rent works only for ICL and IPC: `base * index(today) / index(lease start)` (`RentAdjustmentServiceImpl.java:25`, `:66`). See `wiki/pages/rent-adjustment.md`.

## Definition of done

1. `scripts/verify.sh` is green on your latest commit (or shows only the recorded lint baseline).
2. A new test fails without your fix (negative control).
3. A reviewer agent (different model from the builder) read the diff.
4. You re-read your own diff line by line.

## What lives where

- `proppilot-backend/` Spring Boot 3.2, Java 17. Package `com.prop_pilot`: `config`, `controller`, `dto`, `entity`, `exception`, `repository`, `security`, `service` (+`impl`).
- `proppilot-frontend/` React 19, Vite 7, MUI 7. Components in `src/components`, i18n in `src/contexts/LanguageContext.jsx`, e2e in `e2e/`.
- `scripts/` dev stack and verify. `docs/` mockups. `wiki/` project knowledge.
- `.claude/agents`, `.claude/skills`, `.claude/hooks`, `.claude/settings.json`: this harness.

## Agents

One file per role in `.claude/agents/`. Each pins a default `model`. The caller may override per call (a hook denies `Agent` calls with no `model`). The reviewer must run on a different model than the author.

| Role | Default | Override |
| --- | --- | --- |
| coordinator | opus | sonnet for pure routing of a known plan |
| planner | opus | sonnet for a one-file change |
| builder | sonnet | opus for cross-cutting design |
| tester | sonnet | haiku to re-run existing tests |
| reviewer | haiku | opus for hard diffs (money, security, concurrency) |
| plan-reviewer | sonnet | none; reviews a planner (opus) plan |
| code-reviewer | opus | none; reviews a builder (sonnet) diff in a lane |
| browser-tester | sonnet | none; Playwright CLI headless on the lane port |
| test-auditor | haiku | none; audits how the browser-tester tested |
| deployer | sonnet | haiku to redeploy an unchanged build; only on the human's word |
| explorer-domain, -architecture, -tests, -build | sonnet | haiku for a narrow lookup |
| wiki-curator | haiku | sonnet for wide ingests |

## Feature lanes

Several requirements in parallel, one isolated lane each, human approval after the plans, then stacked PRs: follow `.claude/skills/feature-lanes/SKILL.md` (lane commands: `feature-worktree` skill).

## Knowledge base

Read `wiki/index.md` first. The wiki rules (how to add or fix pages) are in `wiki/AGENTS.md`. That file is not auto-loaded, so read it before you edit anything under `wiki/`.
