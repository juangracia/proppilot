# Wiki log

Append only. Format: `## [YYYY-MM-DD] ingest|query|lint | <title>`. Last five: `grep "^## \[" wiki/log.md | tail -5`

## [2026-10-20] ingest | Wiki bootstrap from Karpathy LLM Wiki gist
- Created `AGENTS.md` (schema), `index.md`, `log.md`, `raw/`, `pages/`.
- Pattern checked against https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## [2026-10-20] ingest | Domain exploration report
- Source: `raw/2026-10-20-explore-domain.md`.
- Created entity pages: property-unit, tenant, lease, payment, index-value, user-owner.
- Created concepts: rent-adjustment, lease-lifecycle, owner-scoping. Created glossary.
- Checked line citations against code at commit 643d5ba (LeaseServiceImpl, PaymentServiceImpl, RentAdjustmentServiceImpl, Lease enum).

## [2026-10-20] ingest | Backend exploration report
- Source: `raw/2026-10-20-explore-backend.md` (truncated at section 6).
- Created architecture/backend and architecture/deploy-railway. Read Dockerfile, railway.json, application.yml directly.

## [2026-10-20] ingest | Frontend exploration report
- Source: `raw/2026-10-20-explore-frontend.md`.
- Created architecture/frontend and concepts/local-dev-auth.
- Confirmed dashboard tenant count is `tenants.length` (DashboardView.jsx:75), added to open-questions.

## [2026-10-20] ingest | Local setup session (coordinator)
- Created decisions.md: ADR-001 JDK 17, ADR-002 POSTGRES_PORT, ADR-003 seed.py, ADR-004 synthetic index data.
- Recorded the verified adjusted rent example in rent-adjustment (lease 1: 450000 to 719415, factor 1.5987).
- Created open-questions.md with 14 items.
- Tests report was pending at this point (ingested below).

## [2026-10-20] ingest | Tests, CI and Railway report
- Source: `raw/2026-10-20-explore-tests.md` (replaced the placeholder, per coordinator).
- Created architecture/testing (backend 28/37 pass, 9 errors from Postgres on 5433; lint 36 problems; no CI).
- Updated deploy-railway (DATABASE_URL JDBC mismatch, JWT_SECRET default, /api/countries public checked at SecurityConfig.java:33), open-questions 11 and 13, index.

## [2026-10-20] ingest | Final verify state from coordinator
- testing: rewritten for `scripts/verify.sh --e2e` (backend 37/37, lint 32 = baseline, build pass, e2e smoke 2/2). Old 28/37 moved to History.
- decisions: ADR-005, unauthenticated requests get 401 (`SecurityConfig.java:42`), test in `DataPortabilityControllerSecurityTest.java`.
- backend: added Security section. open-questions 11 and index updated.
- .obsidian: keep app.json, appearance.json, core-plugins.json. workspace.json stays ignored.

## [2026-10-20] lint | Whole wiki after verify state
- Fixed stale claims: "28/37", "9 errors", "36 lint problems" in testing, open-questions, index.
- Checked: SecurityConfig.java:42 entry point and the new test file exist. All wikilinks resolve.

## [2026-10-20] ingest | Claude Code harness setup
- Created architecture/harness: memory split, 4 skills, 4 subagents, SessionStart hook, permissions. Formats checked against code.claude.com/docs (memory, sub-agents, skills, hooks).
- CLAUDE.md trimmed to 59 lines; setup and troubleshooting moved to the `dev-stack` skill. `/verify` now compares against testing instead of CLAUDE.md.
- index: added harness.
- Model policy: workers on sonnet, verifier and wiki-curator on haiku. CLAUDE.md gained a Workers section.

## [2026-10-20] ingest | railway-deploy skill
- Created `.claude/skills/railway-deploy/SKILL.md` from `docs/deploy-railway.md` (procedure and traps; the doc stays the runbook).
- harness: added the skill to the Skills list.

## [2026-10-20] ingest | Railway prep, model policy, skills
- Source: `raw/2026-10-20-railway-prep.md` (commit 9f6de6b, Railway state, seed.py reason, model policy, skills).
- deploy-railway: rewritten. Backend CMD and port verified (`Dockerfile:12`, `application.yml:24`), PG* URL composition (`application.yml:3-6`), frontend build ARGs. Added Railway state, `meetup` env plan, OAuth and seed notes. Dropped the resolved CMD and DATABASE_URL UNVERIFIED items.
- decisions: ADR-006 (new Railway env `meetup`, never touch production), ADR-007 (model on every Agent call, hook, `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`). ADR-003 gained the populate-script evidence.
- harness: PreToolUse hook and model policy added; global skills listed. backend: config env vars updated. open-questions 13 resolved, 15-19 added. index updated, new raw source listed.

## [2026-10-20] ingest | Stop hook for wiki ingest
- Added `.claude/hooks/wiki-ingest-check.sh` (Stop): blocks once per change set when work outside wiki/ is newer than log.md. Fields checked against code.claude.com/docs/en/hooks (stop_hook_active, decision block + reason).
- harness: Hooks list updated. CLAUDE.md: one line under Where knowledge lives.

## [2026-10-20] ingest | parallel worktrees
- Added `scripts/wt.sh` (new, up, down, seed, verify, ls, rm): slot ports and one database per slot in the shared Postgres. Vite, Playwright, smoke spec, `seed.py --db`, `verify.sh`, `dev-backend.sh` read `BACKEND_PORT`, `FRONTEND_PORT`, `DB_NAME` (slot 0 defaults unchanged).
- New page `pages/architecture/parallel-worktrees.md`, skill `.claude/skills/parallel-worktrees/`, CLAUDE.md section.
- Proved with two worktrees verified at once (lowest free memory 28%). ESLint Node globals added, lint baseline 32 to 28; testing page updated.

## [2026-10-20] ingest | Plan REQ-001 + REQ-002 (pending Juan's validation)
- Wrote `docs/plans/2026-10-20-req-001-002-plan.md`: computed delinquency (no OVERDUE state), new Agenda view, decisions D1-D10 with recommendations, step 0 shared scaffolding, two lanes on slots 1 and 2, merge REQ-002 first.
- Findings: payments cannot be future-dated (`proppilot-backend/src/main/java/com/prop_pilot/entity/Payment.java:42`), so overdue must come from the lease schedule; Lease has no due day; the dashboard already computes 60-day expiry and PENDING alerts client-side (`proppilot-frontend/src/components/DashboardView.jsx:79-146`); verify runs only `smoke.spec.js` (`scripts/verify.sh:72`); the seed leaves every active lease unpaid for the current month and none ending within 90 days.
- Decision status: pending. No wiki pages changed until Juan validates.

## [2026-10-20] ingest | parallel worktrees: container per slot
- Design change from Juan: each slot gets its own Postgres container `proppilot-pg-wtN` (:5440+N, own volume, 256 MB cap, small buffers) instead of a database in the shared container. `rm` deletes container and volume; `down` stops it. `seed.py --container`, `PG_CONTAINER` in env.sh.
- Re-proved with two worktrees verified at once: lowest free memory 29%, about 33 MB per slot Postgres, 212 MB per backend. parallel-worktrees page, skill and CLAUDE.md updated.

## [2026-10-20] ingest | Railway skill is CLI-first
- Upgraded Railway CLI 4.11.2 to 5.71.0 (`brew upgrade railway`). Rewrote the CLI path in `.claude/skills/railway-deploy/SKILL.md` from `--help` output (add, up, variable set, domain, redeploy, service delete); `docs/deploy-railway.md` points to it.
- Found Railway's official skill `use-railway` (`railwayapp/railway-skills`, installed by `railway setup agent`). Not installed; ours keeps the PropPilot specifics.
- UNVERIFIED until first deploy: `railway domain` before the first deployment, and Docker ARG pass-through of VITE_* via `up`.

## [2026-10-20] ingest | Paso 0 for REQ-001/REQ-002 (shared prep)
- `scripts/seed.py`: leases now relative to today. Demo has 3 leases paid this month (one only half), 2 overdue (one month and two months behind), 1 lease ending in 45 days, 1 index adjustment in 12 days (IPC every 3 months). Index values start 2023-01 so older starts work.
- Left out on purpose: an ACTIVE lease past its end date. `DashboardView` counts it as active, `GET /api/leases/active` does not, so `smoke.spec.js` fails. REQ-002 can add that case with its own fix.
- Reserved `// REQ-001` and `// REQ-002` blocks at the end of `es` and `en` in `LanguageContext.jsx`, and two slot comments above the alerts section in `DashboardView.jsx`.
- `proppilot-frontend/e2e/helpers.js` holds `login`, `apiGet`, `formatArs`; `scripts/verify.sh` runs `smoke.spec.js` plus `e2e/req-*.spec.js`.

## [2026-10-20] ingest | parallel worktrees: full page rewrite
- Rewrote `pages/architecture/parallel-worktrees.md` from `scripts/wt.sh`, `scripts/resource-watch.sh`, `scripts/lib/env.sh`, `scripts/lib/java.sh` and the skill: why, mermaid layout, ports, every command with `path:line`, limits, resource watch, wiring, gotchas.
- New facts: `MAX_STACKS` counts only worktree slots, not main. Default `POSTGRES_PORT` is 5433 (`scripts/lib/env.sh:11`), which is another project's container `proppilot-stacks-pg`; main uses 5434 via `.dev.env`.
- `wt-verifier` 7/7 PASS and the 16 GB / 750 MB figures come from the coordinator brief, marked UNVERIFIED. Index line updated.
