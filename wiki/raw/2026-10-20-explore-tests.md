---
source: explore-tests subagent (relayed by coordinator)
date: 2026-10-20
branch: demo/part2-cold
commit: 643d5ba
immutable: true
---

BACKEND: default JDK 25 fails to compile (Lombok, PaymentServiceImpl.java:109). With JDK 17 `mvn test`: 37 tests, 28 pass, 9 errors, 0 failures. Errors: AuthControllerTest (4), DataPortabilityControllerTest (5), cause "password authentication failed for user proppilot": they boot full Spring context against real Postgres at application.yml default localhost:5433; another project's container proppilot-stacks-pg holds 5433. Passing unit tests: JwtUtilTest 6, RentAdjustmentServiceImplTest 6, IndexValueServiceImplTest 3, ExcelImportExportServiceTest 7, GlobalExceptionHandlerTest 6. JUnit 5 + Mockito, no Testcontainers/H2, no src/test/resources. No tests for Property/Tenant/Lease/Payment services or controllers. No mvnw.
FRONTEND: npm ci needs --legacy-peer-deps (Capacitor peer deps). build OK (2.8s, >500kB chunk warning). lint: 36 problems (32 errors, 4 warnings), e.g. src/contexts/LanguageContext.jsx:5 react-refresh/only-export-components. No unit tests, no typecheck. Only e2e/visual-match.spec.js. Coordinator added e2e/smoke.spec.js (2 tests, pass, negative control fails as expected).
CI: none on any branch.
RAILWAY: backend Dockerfile (multi-stage JDK 17), railway.json (healthcheck /api/countries), Procfile, system.properties; frontend Dockerfile + .railwayignore. Frontend Dockerfile hardcodes old VITE_API_URL and Google client id; .env.production says /api. Backend env: DATABASE_URL in JDBC form (Railway gives postgresql://), DATABASE_USERNAME/PASSWORD, JWT_SECRET (insecure default), CORS_ORIGINS, GOOGLE_CLIENT_ID. Schema via ddl-auto update. /api/countries public: UNVERIFIED.
GAPS for verify loop: test DB (Testcontainers), JDK pin + mvnw, lint baseline, Vitest, CI workflow.
