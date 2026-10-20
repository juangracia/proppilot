---
type: decisions
updated: 2026-10-20
sources: [proppilot-backend/.sdkmanrc, proppilot-backend/docker-compose.yml, scripts/seed.py, scripts/lib/java.sh]
---

# Decisions (ADR log)

Newest first. Format: context, decision, consequences.

## ADR-005: Unauthenticated API requests return 401, not 403 (2026-10-20)
- Context: `DataPortabilityControllerTest.exportAll_Unauthenticated_ShouldReturn401` failed with 500, because the class uses `@ActiveProfiles("local")` and the local chain permits everything (`proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java:46`). Moving the test to a class with no profile showed a real prod bug: the `!local` chain had no `authenticationEntryPoint`, so a request without a token got 403.
- Decision: the 401 test lives in `DataPortabilityControllerSecurityTest.java` (no profile). The `!local` chain uses `HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)` (`SecurityConfig.java:42`). The local chain is unchanged.
- Consequences: no token gives 401, so the frontend can tell "log in again" apart from "not allowed". An authenticated user who is forbidden still gets 403.

## ADR-004: Synthetic index data, tagged `seed-synthetic` (2026-10-20)
- Context: [[rent-adjustment]] needs [[index-value]] rows. This branch has no ingestion and no seed.
- Decision: `scripts/seed.py` inserts monthly ICL (start 10.0, +2.5%/month) and IPC (start 5000.0, +2.2%/month) from 2024-01 to today, `source = 'seed-synthetic'`.
- Consequences: the adjusted-rent card shows real-looking numbers in dev. The values are not BCRA or INDEC data. Never copy them to prod. Filter by `source` to remove them.

## ADR-003: New `scripts/seed.py` replaces the old populate scripts (2026-10-20)
- Context: `proppilot-backend/populate_database.sh` and `create_sample_data.sh` predate the Lease entity. They create payments against properties, so leases and payments end up at 0.
- Decision: a stdlib-only Python seeder that uses the current API (`propertyUnitId`, `tenantIds`, `leaseId`) and SQL for index values. `--reset` truncates domain tables. Data: 8 Argentine properties, 8 tenants, 6 leases (ICL, IPC, one terminated), ~122 payments.
- Consequences: the old shell scripts are stale. Prefer `seed.py`. Seeded data belongs to the local fallback user, see [[local-dev-auth]].

## ADR-002: Postgres host port is configurable (`POSTGRES_PORT`) (2026-10-20)
- Context: on the dev machine, port 5433 (the default in `proppilot-backend/docker-compose.yml`) was taken by an unrelated container `proppilot-stacks-pg`.
- Decision: compose maps `${POSTGRES_PORT:-5433}:5432`. The dev scripts read `POSTGRES_PORT` from `.dev.env` and build `DATABASE_URL` from it. This machine uses 5434.
- Consequences: default behavior is unchanged for everyone else.

## ADR-001: Build the backend with JDK 17 (`.sdkmanrc`) (2026-10-20)
- Context: the global JDK was 25. Spring Boot 3.2 manages Lombok 1.18.30, which fails on JDK 25. Compile errors were "cannot find symbol" on Lombok getters in `Lease.java`.
- Decision: `proppilot-backend/.sdkmanrc` pins `java=17.0.15-tem` (same as `system.properties` and the Railway Dockerfile). `scripts/lib/java.sh` picks a JDK in order: `PROPPILOT_JAVA_HOME`, sdkman 17, sdkman 21, Homebrew openjdk@21. It ignores a global `JAVA_HOME`.
- Consequences: local builds match prod. An alternative for later: upgrade Spring Boot or pin a newer Lombok so JDK 25 works.
