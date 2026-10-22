---
title: Testing
type: system
tags: [tests, lint, verify]
sources: [2026-10-22-explorer-findings]
updated: 2026-10-22
---

# Testing

## Backend

Command: `JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem mvn -B -q test` in `proppilot-backend/`.

Test classes under `proppilot-backend/src/test/java/com/prop_pilot/`: `controller/AuthControllerTest`, `controller/DataPortabilityControllerTest`, `exception/GlobalExceptionHandlerTest`, `security/JwtUtilTest`, `service/ExcelImportExportServiceTest`, `service/IndexValueServiceImplTest`, `service/RentAdjustmentServiceImplTest`.

Baseline on 22 Oct 2026 without Postgres: 37 tests, 28 pass, 9 error. The 9 errors are in the two `@SpringBootTest` controller tests, which need Postgres on 5433. With the DB up, one test still fails: `DataPortabilityControllerTest#exportAll_Unauthenticated_ShouldReturn401`. Profile `local` falls back to the dev user, so there is no 401, and the mocked service returns null bytes, so the endpoint answers 500 (`scripts/baselines/backend-known-failures.txt`). `verify.sh` treats only that test as known.

Not covered: Lease, Payment, PropertyUnit and Tenant controllers and services, repositories, `SecurityConfig`.

## Frontend

No unit tests and no `test` script. E2E with Playwright:
- `proppilot-frontend/e2e/visual-match.spec.js`: compares the UI to mockups in `docs/mockups`.
- `proppilot-frontend/e2e/smoke.spec.js`: smoke test that checks UI against API data for the seeded user. `playwright.config.js` reads `FRONTEND_PORT` (default 3000).
- `visual-match.spec.js` fails on HEAD because it expects `demo@proppilot.ar` data. `verify.sh` does not run it.
- The default html reporter rewrites the tracked `proppilot-frontend/playwright-report/index.html`. Restore it with `git checkout` before you commit.

Lint: `npm run lint` exits non-zero on HEAD. The explorer counted 36 problems (32 errors, 4 warnings). `verify.sh` counts errors plus warnings from eslint JSON and records 32 in `scripts/baselines/lint-problems.txt`. The two counts differ and the cause is not checked (UNVERIFIED). `verify.sh` fails only if the count grows; `--update-baseline` rewrites it.

Build: `npm run build` (about 4 seconds).

## Verify

`scripts/verify.sh` stages: stack up + seed, backend tests vs the known-failures file, frontend build, lint vs baseline, Playwright smoke only. It prints a summary table and exits non-zero on any FAIL.

Sources: [[2026-10-22-explorer-findings|explorer findings]], test directory listing.
