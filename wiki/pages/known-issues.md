---
title: Known issues
type: health
tags: [bugs, smells]
sources: [2026-10-22-explorer-findings]
updated: 2026-10-22
---

# Known issues

Not fixed. Do not fix them as a side effect of other work. Ask first.

## Behavior

- No job sets a lease to EXPIRED when the end date passes. Status only becomes EXPIRED on reactivate (`service/impl/LeaseServiceImpl.java:254-255`). Checked with `grep -rn "@Scheduled\|EXPIRED" proppilot-backend/src/main`: `@EnableScheduling` is on (`PropPilotApplication.java:12`) but no `@Scheduled` method exists, and `EXPIRED` appears only in the enum (`Lease.java:158`), that reactivate branch, and an Excel help text (`ExcelImportExportServiceImpl.java:814`).
- Outstanding amount is base `monthlyRent` times months elapsed minus paid RENT payments. It ignores rent adjustment (`PaymentServiceImpl.java:159-181`).
- Payment cap uses base rent, not adjusted rent (`PaymentServiceImpl.java:61`).
- `adjustmentFrequencyMonths` is stored but unused (`entity/Lease.java:68`).
- `index_values` is never populated by the app. Adjusted rent shows no adjustment on a fresh DB. See [[rent-adjustment|rent adjustment]].
- Error messages mix English and Spanish (`LeaseServiceImpl.java:58` vs `TenantServiceImpl.java:98`).
- Duplicate tenant throws `IllegalArgumentException` (`TenantServiceImpl.java:36`), which the handler maps to 500 via the generic `RuntimeException` handler (`GlobalExceptionHandler.java:76`). UNVERIFIED: not run.

## Config and security

- Three CORS configs; `CorsConfig.java` is the live one. It excludes PATCH (`:27`).
- `/actuator/**` is permitted (`SecurityConfig.java:36`) but there is no actuator dependency.
- Default secrets are committed (`application.yml:36`, DB password in `docker-compose.yml`).
- Hardcoded Railway URL in `proppilot-frontend/src/config/api.js:6`.

## Test and tooling

- `DataPortabilityControllerTest#exportAll_Unauthenticated_ShouldReturn401` fails on HEAD under profile `local` (`scripts/baselines/backend-known-failures.txt`).
- `proppilot-frontend/e2e/visual-match.spec.js` fails on HEAD: it expects `demo@proppilot.ar` data.
- `proppilot-frontend/playwright-report/index.html` is tracked although `playwright-report/` is in the frontend `.gitignore`, so every Playwright run dirties it.

## Code health

- `proppilot-frontend/src/components/PropertyUnitsListOld.jsx` is dead code.
- Huge components: `LeaseForm.jsx` (1961 lines), `PropertyUnitsList.jsx` (1376), `TenantsList.jsx` (1175), `PaymentForm.jsx` (1116).
- `npm ci` fails without `--legacy-peer-deps` (capacitor-google-auth wants core ^6, project uses ^7).
- Seed scripts `proppilot-backend/*.sh` call the API without auth and are probably stale. Use `scripts/seed.sh`.

Sources: [[2026-10-22-explorer-findings|explorer findings]], files cited inline.

## Follow-ups

Found in review round 2 of the stack scripts. Not fixed (review limit of 2 rounds reached).

1. FIXED (`scripts/dev-up.sh` now checks the db, backend and frontend ports before it starts anything). Was: `dev-up.sh` started the DB before the port checks and could leave a new DB container behind.
2. `proppilot-frontend/e2e/visual-match.spec.js:3` hardcodes `http://localhost:8080/api`. Fix: read `BACKEND_PORT`.

Related: [[architecture]], [[testing]], [[decisions]]
