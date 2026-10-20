---
type: architecture
updated: 2026-10-20
sources: [raw/2026-10-20-explore-tests.md, scripts/verify.sh, proppilot-backend/src/test/java/com/prop_pilot/controller/DataPortabilityControllerSecurityTest.java]
---

# Testing and verification

## One command
`scripts/verify.sh` runs backend tests, frontend lint (against a baseline) and frontend build. `scripts/verify.sh --e2e` also runs the Playwright smoke test. Settings come from `.dev.env` (`scripts/lib/env.sh`), including `POSTGRES_PORT`.

## Current state (2026-10-20, after the harness setup)
`scripts/verify.sh --e2e`:
- Backend: 37 of 37 tests pass.
- Lint: 28 errors, equal to the baseline, so it passes. New errors above the baseline fail.
- Build: pass.
- E2E smoke: 2 of 2 pass.

## Backend (`proppilot-backend`, JUnit 5 + Mockito)
- Needs JDK 17 or 21. JDK 25 does not compile (Lombok). See [[decisions]] ADR-001.
- Unit tests: `JwtUtilTest` 6, `RentAdjustmentServiceImplTest` 6, `IndexValueServiceImplTest` 3, `ExcelImportExportServiceTest` 7, `GlobalExceptionHandlerTest` 6.
- Controller tests (`AuthControllerTest`, `DataPortabilityControllerTest`, `DataPortabilityControllerSecurityTest`) boot the full Spring context against the real local Postgres. They need the DB up on `POSTGRES_PORT`.
- `DataPortabilityControllerTest` uses `@ActiveProfiles("local")` (permit-all chain), so it cannot test auth. The 401 test lives in `DataPortabilityControllerSecurityTest` with no profile. See [[decisions]] ADR-005.
- No Testcontainers, no H2, no `src/test/resources`. No Maven wrapper.
- Not tested: PropertyUnit, Tenant, Lease, Payment services and controllers. So [[lease-lifecycle]], [[payment]] rules and [[owner-scoping]] have no tests.
- JaCoCo enforces 70% line coverage per package (`proppilot-backend/pom.xml:131-169`). UNVERIFIED whether `mvn verify` passes it.

## Frontend (`proppilot-frontend`)
- `npm ci --legacy-peer-deps` (Capacitor peer deps).
- Build OK, with a warning about a chunk over 500 kB.
- Lint: 28 errors in the baseline (for example `src/contexts/LanguageContext.jsx:5` `react-refresh/only-export-components`).
- No unit tests, no typecheck (plain JS).
- Playwright: `e2e/smoke.spec.js` (2 tests, negative control checked) and the older `e2e/visual-match.spec.js`.

## History
Before the setup (raw tests report): on JDK 17, 28 of 37 passed and 9 errored. Eight errors were Postgres auth failures, because port 5433 belonged to another container. One was the real 401 bug (ADR-005).

## CI
None on any branch.

## Remaining gaps
1. Testcontainers, so controller tests do not depend on a local DB.
2. `mvnw`.
3. Burn down the lint baseline.
4. Vitest for unit tests.
5. A CI workflow that runs `scripts/verify.sh`.
6. Tests for the core services and for owner isolation.

Related: [[backend]], [[frontend]], [[open-questions]].
