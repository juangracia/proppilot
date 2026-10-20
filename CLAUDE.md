# PropPilot

Rental management for small landlords in Argentina: properties, tenants, leases (contratos), payments, and rent adjusted by ICL/IPC indexes. UI is Spanish by default.

## Second brain (read first)

- `wiki/index.md` is the catalog of what we already know (domain, architecture, decisions, open gaps). Read it before exploring the code.
- `wiki/AGENTS.md` is the schema: how to ingest, query and lint the wiki.
- After a durable learning (a gotcha, a decision, a domain rule), ingest it into `wiki/` and append an entry to `wiki/log.md`. Do not keep it only in chat.

## Layout

- `proppilot-backend/` Spring Boot 3.2, Java 17, Maven (no `mvnw`), PostgreSQL. Layers: `controller/ -> service/ (interfaces) -> service/impl/ -> repository/`, JPA entities in `entity/`. Controllers return entities, no DTO mappers.
- `proppilot-frontend/` React 19 + Vite 7 + MUI 7, plain JS. No router: `src/App.jsx` switches views by index. Axios is called inside components. i18n lives in `src/contexts/LanguageContext.jsx`. Capacitor 7 for iOS/Android.
- `scripts/` dev, seed and verify entry points. `docs/` deploy notes and design mockups.
- `wiki/` Obsidian vault (second brain).

## Commands

```bash
cp .dev.env.example .dev.env          # once; set POSTGRES_PORT if 5433 is taken
scripts/dev-backend.sh                # Postgres in Docker + backend on :8080, profile `local`
scripts/seed.py --reset               # wipe + load Argentine demo data (needs backend running)
cd proppilot-frontend && npm ci --legacy-peer-deps && npm run dev   # :3000, proxies /api to :8080
scripts/verify.sh                     # backend tests + frontend lint + build
scripts/verify.sh --e2e               # + Playwright smoke (needs backend running and seeded)
```

Swagger: http://localhost:8080/swagger-ui.html

## Gotchas

- **JDK**: build with 17 (or 21). Lombok from Boot 3.2 fails on JDK 25 with `cannot find symbol` on getters. `scripts/lib/java.sh` picks the right JDK and ignores a global `JAVA_HOME`. `.sdkmanrc` pins 17 for sdkman users.
- **Backend tests need Postgres**: `AuthControllerTest` and `DataPortabilityControllerTest` are full `@SpringBootTest`. Start `scripts/dev-backend.sh` first; `verify.sh` passes the DB URL from `.dev.env`.
- **Lint baseline**: the frontend has 32 pre-existing ESLint errors. `verify.sh` fails only if the count goes up. Lower `LINT_ERROR_BASELINE` when you fix some.
- **Security tests need the real chain**: profile `local` opens every request, so tests that assert 401/403 must not use `@ActiveProfiles("local")` (see `DataPortabilityControllerSecurityTest`).
- **Local auth**: profile `local` permits every request. With no token, the backend acts as `app.local-dev.email` (`application-local.yml`, `juanmgracia@gmail.com`), and that user owns the seeded data. The login page quick-login users (Alice, Bob, Charlie) get JWTs for *other* users and see empty accounts. To see seeded data in the UI, use "Custom User" with the local-dev email.
- `/auth/local` (no password) exists only in profile `local` (`AuthController.java:69`).
- Old `populate_database.sh` / `create_sample_data.sh` predate leases and do not create leases or payments. Use `scripts/seed.py`.
- Index values from `seed.py` are synthetic (`source='seed-synthetic'`), not BCRA/INDEC data.

## Rules

- **Owner scoping**: every entity has an `owner`. Every repository query must filter by owner id (`findByIdAndOwnerId`, etc.). Get it from `CurrentUserService`, never from the request body.
- Schema changes go through JPA entities (`ddl-auto: update`) plus `config/DatabaseMigrationRunner` for alters Hibernate cannot do. There is no Flyway.
- User-facing strings: add both `es` and `en` in `LanguageContext.jsx`.
- Backend error messages shown to users are in Spanish.

## Domain invariants

- Lease: at least one tenant, a property, `endDate > startDate`, at least 30 days, no overlapping active lease on the same property (`LeaseServiceImpl.java:58-107`).
- Lease status: `ACTIVE | EXPIRED | TERMINATED`. Terminate -> TERMINATED. Reactivate only from TERMINATED. Delete is soft; a lease with payments cannot be deleted, terminate it instead.
- Payment: needs a lease, date not before lease start, amount at most 3x monthly rent (`PaymentServiceImpl.java:43-63`). Types: RENT, DEPOSIT, MAINTENANCE, UTILITY, OTHER. Status: PAID, PENDING.
- Property or tenant cannot be deleted while it has non-deleted leases.
- Adjusted rent (`RentAdjustmentServiceImpl.java`): `base * index(asOf) / index(leaseStart)`, ICL and IPC only, factor scale 4 HALF_UP. Anything else returns base rent with `hasAdjustment=false`.

## Definition of done

1. `scripts/verify.sh --e2e` ends with `verify: OK`.
2. You opened the UI on http://localhost:3000 and checked the changed flow by hand (Playwright MCP is fine).
3. New behavior has a test that fails without the change.
4. Durable learnings are in `wiki/` with a `log.md` entry.

## Deploy

Railway, one service per folder plus Postgres. Env vars, gaps and smoke checks: `docs/deploy-railway.md`. Never deploy or push to `main`/`master` without the user's explicit OK.
