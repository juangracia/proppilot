# Testing

## Backend

Command: `JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem mvn -B -q test` in `proppilot-backend/`.

Test classes under `proppilot-backend/src/test/java/com/prop_pilot/`: `controller/AuthControllerTest`, `controller/DataPortabilityControllerTest`, `exception/GlobalExceptionHandlerTest`, `security/JwtUtilTest`, `service/ExcelImportExportServiceTest`, `service/IndexValueServiceImplTest`, `service/RentAdjustmentServiceImplTest`.

Baseline on 22 Oct 2026 without Postgres: 37 tests, 28 pass, 9 error. The 9 errors are in the two `@SpringBootTest` controller tests, which need Postgres on 5433. With the DB up, the expected result is 37 of 37 (UNVERIFIED by the explorer; `scripts/verify.sh` is the check).

Not covered: Lease, Payment, PropertyUnit and Tenant controllers and services, repositories, `SecurityConfig`.

## Frontend

No unit tests and no `test` script. E2E with Playwright:
- `proppilot-frontend/e2e/visual-match.spec.js`: compares the UI to mockups in `docs/mockups`.
- `proppilot-frontend/e2e/smoke.spec.js`: smoke test that checks UI against API data (added by the harness).

Lint: `npm run lint` has a baseline of 36 problems (32 errors, 4 warnings) and exits non-zero. `verify.sh` fails only if the count grows.

Build: `npm run build` (about 4 seconds).

## Verify

`scripts/verify.sh` runs backend tests, frontend build, lint vs baseline, and the Playwright smoke test, then prints a summary.

Sources: [explorer findings](../raw/2026-10-22-explorer-findings.md), test directory listing.
