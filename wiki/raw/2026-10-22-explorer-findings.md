# PropPilot cold repo: explorer findings (22 Oct 2026)
Repo: /Users/juangracia/dev/proppilot-cold/.claude/worktrees/harness (branch harness/claude-setup, from demo/part2-cold 643d5ba). Established facts, do not re-derive.

## Toolchain / run
- Backend Spring Boot 3.2.0, Java 17 (pom). Default java is 25: use JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem. No mvnw; system mvn 3.9.12.
- Postgres 15 via proppilot-backend/docker-compose.yml, host port 5433, db/user proppilot, pw proppilot123. ddl-auto: update + config/DatabaseMigrationRunner.java raw ALTERs. No Flyway.
- Profile `local` (SPRING_PROFILES_ACTIVE=local): permits all, dev user via app.local-dev.email, POST /api/auth/local.
- Backend port 8080. Frontend Vite dev port 3000, proxy /api -> localhost:8080. Node 24.3, no .nvmrc.
- Frontend: React 19, Vite 7, MUI 7, JSX no TS, no router (App.jsx selectedView int), axios direct in components, i18n in contexts/LanguageContext.jsx (es+en, add both), Capacitor mobile.
- `npm ci` FAILS (ERESOLVE capacitor-google-auth peer ^6 vs core ^7): use `npm ci --legacy-peer-deps`. `npm run build` ok (~4s). `npm run lint` baseline 36 problems (32 errors, 4 warnings), exits non-zero.
- Env: DATABASE_URL/USERNAME/PASSWORD, CORS_ORIGINS, PORT, GOOGLE_CLIENT_ID, JWT_SECRET, JWT_EXPIRATION; FE VITE_API_URL, VITE_GOOGLE_CLIENT_ID.

## Tests baseline
- mvn -B -q test with JDK17: 37 tests, 28 pass, 9 error (AuthControllerTest, DataPortabilityControllerTest: @SpringBootTest profile local needs Postgres on 5433). Expected 37/37 with compose postgres up (UNVERIFIED).
- Frontend: no unit tests, no `test` script; only e2e/visual-match.spec.js (Playwright, baseURL :3000, webServer block).
- Untested: Lease/Payment/PropertyUnit/Tenant controllers+services, repositories, SecurityConfig.

## Architecture
- Packages com.prop_pilot: config, controller, dto, entity, exception, repository, security, service(+impl). Controllers return JPA entities directly; errors via GlobalExceptionHandler ErrorResponse (404 not found, 400 validation, 422 BusinessLogicException).
- Auth: Google ID token -> POST /api/auth/google -> own JWT HS256. FE stores localStorage['token'].
- API: /api/auth, /api/countries, /api/data (export/template/import), /api/property-units, /api/tenants, /api/leases (incl. /{id}/adjusted-rent, terminate, reactivate, soft delete, restore, permanent), /api/payments (incl. outstanding, total-paid, history).
- Smells: 3 CORS configs (CorsConfig.java hardcoded allowlist is the live one, no PATCH), /actuator permitted but no actuator dep, hardcoded Railway URL FE/src/config/api.js:6, default secrets committed, PropertyUnitsListOld.jsx dead, huge components (LeaseForm.jsx 1961 lines).

## Domain
- Entities: User(owner), PropertyUnit, Tenant, Lease, Payment, IndexValue. All scoped by owner_id via CurrentUserService.
- Lease: status ACTIVE/EXPIRED/TERMINATED; AdjustmentIndex ICL, IPC, DOLAR_BLUE, DOLAR_OFICIAL, DOLAR_MEP, NONE; many-to-many tenants; soft delete.
- Rules (LeaseServiceImpl): >=1 tenant, end>start, >=30 days, no overlap with ACTIVE non-deleted lease on same property; reactivate only TERMINATED; hard delete blocked if payments. Payment: date >= lease start, not future, amount <= 3x monthlyRent. Tenant/property delete blocked if non-deleted leases (Spanish msgs).
- Adjusted rent (RentAdjustmentServiceImpl): only ICL/IPC; factor = index(today)/index(lease start), cumulative; adjustmentFrequencyMonths unused. NOTHING seeds index_values, so hasAdjustment=false on fresh DB.
- History: KAN-36 adjusted rent re-landed in dc7daa6 (#34) after revert of #33. HEAD 643d5ba removed AI tooling for the cold demo.
- Seed scripts in proppilot-backend/*.sh call API without auth: likely stale.
- Open issues: no auto-EXPIRED, outstanding ignores PENDING/adjustment, payment cap uses base rent, mixed EN/ES error messages.

## Build/run/deploy (explore-build)
- Backend build: JAVA_HOME=17 `mvn -q -DskipTests package` ~4s -> target/prop-pilot-backend-1.0.0.jar. Boots with `--spring.profiles.active=local` after `docker compose up -d` (container proppilot-postgres) in 2.3s. Health: use GET /api/countries (200). /actuator/health = 500 (no actuator dep), so start-backend.sh health wait is broken.
- No CI (.github/workflows absent).
- Deploy: Railway, both sides Dockerfile. Backend railway.json healthcheck /api/countries. Frontend Dockerfile bakes VITE_API_URL prod URL + Google client id as ENV.
- CONFLICT to resolve: test explorer got lint baseline 36 problems after `npm ci --legacy-peer-deps`; build explorer got `eslint: command not found`. Stack worker decides with evidence.
- Fresh DB logs harmless "column tenant_id of relation leases does not exist" from DatabaseMigrationRunner.
