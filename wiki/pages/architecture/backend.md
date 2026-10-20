---
type: architecture
updated: 2026-10-20
sources: [raw/2026-10-20-explore-backend.md, proppilot-backend/pom.xml, proppilot-backend/src/main/resources/application.yml]
---

# Backend (proppilot-backend)

## Stack
- Java 17 (`proppilot-backend/system.properties`, `proppilot-backend/pom.xml:21`), Spring Boot 3.2.0 (`pom.xml:10`), Maven. No Maven wrapper.
- Web, Data JPA, Validation, Security, OAuth2 client, PostgreSQL, Lombok, springdoc, jjwt, google-api-client, Apache POI (Excel import/export).
- JaCoCo requires 70% line coverage per package (`pom.xml:131-169`).
- Build JDK must be 17 or 21. JDK 25 breaks Lombok. See [[decisions]].

## Layout (`proppilot-backend/src/main/java/com/prop_pilot/`)
- `controller/` (7), `service/` interfaces with `service/impl/`, `repository/` (JPA), `entity/`, `dto/`, `config/`, `security/` (JWT), `exception/GlobalExceptionHandler`.
- No DTO mappers. Controllers take and return entities. Write-only `@Transient` JSON fields carry ids in (`propertyUnitId`, `tenantIds`, `leaseId`).

## API (all under `/api`)
- `auth`: `POST /google`, `GET /me`, `POST /local` (dev only). See [[local-dev-auth]].
- `property-units`, `tenants`, `leases`, `payments`: CRUD plus extras (see raw backend report section 3).
- `leases/{id}/adjusted-rent`: see [[rent-adjustment]].
- `data`: Excel export, template, import preview and execute.
- `countries`: supported countries and currencies. Also the Railway health check.
- Swagger UI: `/swagger-ui.html`. OpenAPI: `/api-docs`.

## Persistence
- PostgreSQL only. Schema by Hibernate `ddl-auto: update` (`proppilot-backend/src/main/resources/application.yml:9`). No Flyway or Liquibase.
- `DatabaseMigrationRunner` runs raw `ALTER TABLE` statements at startup. On a fresh DB it logs a harmless "column tenant_id ... does not exist" line at INFO level.
- Local Postgres: `proppilot-backend/docker-compose.yml`, container `proppilot-postgres`, host port from `POSTGRES_PORT` (default 5433).

## Config (env vars, defaults in `application.yml`)
`DATABASE_URL` (overrides the URL below, never set it to Railway's `postgresql://` value), `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` (Railway Postgres vars, local fallbacks; `application.yml:3-6`), `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `PORT` (8080), `SHOW_SQL`, `CORS_ORIGINS` (default `http://localhost:3000`), `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `JWT_EXPIRATION`, `SPRING_PROFILES_ACTIVE`. Railway setup: [[deploy-railway]].

## Run locally
`scripts/dev-backend.sh` (starts Postgres, picks a JDK 17/21, runs with the `local` profile). Settings in `.dev.env` (copy from `.dev.env.example`). Then `scripts/seed.py --reset`. Check the repo root `CLAUDE.md` for the current commands.

## Security
- Two chains in `proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java`: `!local` (JWT, `:24`) and `local` (permit all, `:46`).
- No token on a protected route gives 401 (`:42`). See [[decisions]] ADR-005.

Tests and verification: [[testing]].

Related: [[frontend]], [[deploy-railway]], [[owner-scoping]].
