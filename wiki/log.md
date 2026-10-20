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
