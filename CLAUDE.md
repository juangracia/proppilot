# PropPilot

Rental management for small landlords in Argentina: properties, tenants, leases (contratos), payments, and rent adjusted by ICL/IPC indexes. UI is Spanish by default.

## Where knowledge lives

- `CLAUDE.md` (this file, committed): shared rules every session needs. Keep it short; procedures go in skills.
- `wiki/` (committed): the second brain. Domain, architecture, decisions, open gaps. Read `wiki/index.md` before exploring code. Schema: `wiki/AGENTS.md`. File durable learnings there (`wiki-ingest` skill), never only in chat. A `Stop` hook (`.claude/hooks/wiki-ingest-check.sh`) asks once per change set whether the work needs a wiki entry.
- `CLAUDE.local.md` (gitignored, optional): your personal overrides for this repo.
- Auto memory (`~/.claude/projects/...`, per user, outside the repo): personal preferences only, never project facts.

## Harness

- Skills (`.claude/skills/`): `dev-stack` (start, seed, log in, troubleshoot), `parallel-worktrees` (extra stacks per worktree), `wiki-ingest`, `wiki-query`, `wiki-lint`.
- Subagents (`.claude/agents/`): `backend-worker`, `frontend-worker`, `verifier` (never edits), `wiki-curator` (edits only `wiki/`).
- `/verify` runs the full check. Map: `wiki/pages/architecture/harness.md`.

## Workers

Use a subagent for a short, bounded task that reports back. Spawn a separate session for long, independent work (for example a real deploy). Pick the cheapest model that is good enough.

## Parallel worktrees

Up to 4 extra stacks next to the main one, for parallel sessions. Each slot N has backend `:808N`, frontend `:300N` and its own Postgres container `proppilot-pg-wtN` on `:544N` (own volume, so databases never mix). Slot 0 is the main stack. Drive it with `scripts/wt.sh new|up|seed|verify|ls|down|rm <name>`. `up` refuses below 15% free memory. Procedure and limits: `parallel-worktrees` skill.

## Layout

- `proppilot-backend/` Spring Boot 3.2, Java 17, Maven (no `mvnw`), PostgreSQL. Layers: `controller/ -> service/ (interfaces) -> service/impl/ -> repository/`, JPA entities in `entity/`. Controllers return entities, no DTO mappers.
- `proppilot-frontend/` React 19 + Vite 7 + MUI 7, plain JS. No router: `src/App.jsx` switches views by index. Axios is called inside components. i18n in `src/contexts/LanguageContext.jsx`. Capacitor 7 for iOS/Android.
- `scripts/` dev, seed and verify entry points. `docs/` deploy notes and design mockups.

## Commands

```bash
scripts/dev-backend.sh                # Postgres + backend :8080 (setup and troubleshooting: dev-stack skill)
scripts/seed.py --reset               # demo data, owned by juanmgracia@gmail.com
cd proppilot-frontend && npm run dev  # :3000; log in as "Custom User" juanmgracia@gmail.com
scripts/verify.sh [--only backend|frontend|e2e] [--e2e]
scripts/resource-watch.sh [--once]    # RAM/swap/load/stack watcher for parallel stacks; run under Monitor, one line per OK/WARN/CRIT change
```

## Rules

- **Owner scoping**: every entity has an `owner`. Every repository query filters by owner id (`findByIdAndOwnerId`, etc.). Get it from `CurrentUserService`, never from the request body.
- Schema changes go through JPA entities (`ddl-auto: update`) plus `config/DatabaseMigrationRunner` for alters Hibernate cannot do. No Flyway.
- User-facing strings: add both `es` and `en` in `LanguageContext.jsx`. Backend error messages shown to users are in Spanish.
- Build with JDK 17 or 21, never 25 (Lombok breaks). The scripts pick it for you.
- Lint: `verify.sh` fails if ESLint errors rise above `LINT_ERROR_BASELINE`. Lower it when you fix some.
- Tests that assert 401/403 must not use `@ActiveProfiles("local")`; that profile opens every request.

## Domain invariants

- Lease: at least one tenant, a property, `endDate > startDate`, at least 30 days, no overlapping active lease on the same property (`LeaseServiceImpl.java:58-107`).
- Lease status: `ACTIVE | EXPIRED | TERMINATED`. Reactivate only from TERMINATED. Delete is soft; a lease with payments cannot be deleted, terminate it instead.
- Payment: needs a lease, date not before lease start, amount at most 3x monthly rent (`PaymentServiceImpl.java:43-63`).
- Property or tenant cannot be deleted while it has non-deleted leases.
- Adjusted rent: `base * index(asOf) / index(leaseStart)`, ICL and IPC only, factor scale 4 HALF_UP (`RentAdjustmentServiceImpl.java`). Details: `wiki/pages/concepts/rent-adjustment.md`.

## Definition of done

1. New behavior has a test that fails without the change.
2. `scripts/verify.sh --e2e` ends with `verify: OK`.
3. You checked the changed flow in the UI on http://localhost:3000 (Playwright MCP is fine).
4. Durable learnings are in `wiki/` with a `log.md` entry.

## Deploy

Railway, one service per folder plus Postgres: `docs/deploy-railway.md`. Never deploy or push to `main`/`master` without the user's explicit OK.
