---
source: explore-backend subagent (idle-notification summary)
date: 2026-10-20
branch: demo/part2-cold
commit: 643d5ba
immutable: true
note: The notification was truncated by the harness at section 6. The tail (rest of section 6, sections 7 and 8) was not received. Ask the explore-backend agent for the rest if needed.
---

I read the backend and did not change any files. Below is the report.

## proppilot-backend report

**1. Stack**
- Java 17 (`pom.xml:21`, `system.properties`) on Spring Boot 3.2.0 (`pom.xml:10`), built with Maven. There is no `mvnw`.
- Main libraries: web, data-jpa, validation, security, oauth2-client, PostgreSQL driver, Lombok, springdoc 2.2.0, jjwt 0.12.3, google-api-client 2.2.0, Apache POI 5.2.5 and devtools.
- JaCoCo needs at least 70% line coverage per package (`pom.xml:131-169`).
- This machine has `java` 25.0.1 and Maven 3.9.12 on the PATH. That is not Java 17.

**2. Layout** (`src/main/java/com/prop_pilot/`)
- `controller/` has 7 controllers. `service/` has interfaces, with the code in `service/impl/`. `repository/` uses JPA.
- `entity/` holds Lease, Payment, PropertyUnit, Tenant, User and IndexValue.
- `dto/` holds the auth classes and the `excel/` import rows.
- `config/` holds Cors, Security, OpenApi and DatabaseMigrationRunner. `security/` holds JwtUtil and JwtAuthenticationFilter. `exception/` holds GlobalExceptionHandler.
- There are no mappers. Controllers take in and send back entities directly (`PropertyUnitController.java:40`, `AuthController.java:50`).

**3. Endpoints**
- `/api/auth` (AuthController): POST `/google`, GET `/me`, POST `/local`. `/local` works only in the `local` profile (`AuthController.java:69`).
- `/api/property-units` (PropertyUnitController): POST, GET, GET `/{id}`, GET `/with-leases`, GET `/search`, PUT `/{id}`, DELETE `/{id}`, GET `/{id}/can-delete`.
- `/api/tenants` (TenantController): POST, GET, GET/PUT/DELETE `/{id}`, GET `/search/national-id/{x}`, GET `/search/email/{x}`, GET `/{id}/can-delete`.
- `/api/leases` (LeaseController):
  - POST, GET, GET `/{id}`, GET `/active`.
  - GET `/property-unit/{id}`, GET `/property-unit/{id}/active`, GET `/tenant/{id}`, GET `/tenant/{id}/active`.
  - GET `/{id}/adjusted-rent`, PUT `/{id}`, POST `/{id}/terminate`, POST `/{id}/reactivate`.
  - DELETE `/{id}`, GET `/deleted`, POST `/{id}/restore`, DELETE `/{id}/permanent`.
- `/api/payments` (PaymentController):
  - POST, GET, GET/PUT/DELETE `/{id}`.
  - GET `/lease/{id}`, GET `/property-unit/{id}`, GET `/tenant/{id}`.
  - GET `/lease/{id}/outstanding`, `/outstanding-amount`, `/total-paid`, `/history`.
- `/api/data` (DataPortabilityController): GET `/export`, GET `/template`, POST `/import/preview`, POST `/import/execute`.
- `/api/countries` (CountryController): GET and GET `/{code}`.
- Swagger UI is at `/swagger-ui.html`. The API docs are at `/api-docs`.

**4. Persistence**
- The database is PostgreSQL only. There is no H2.
- The schema comes from Hibernate `ddl-auto: update` (`application.yml:9`). There is no Flyway or Liquibase.
- There is a hand-written `DatabaseMigrationRunner`. It runs raw `ALTER TABLE` statements in its constructor (`DatabaseMigrationRunner.java:29-98`).
- Profiles: `application.yml` and `application-local.yml`. The local profile turns off auth and uses a fixed user email (`application-local.yml:7`).
- There is no SQL seed data. To add sample data, run the curl scripts `populate_database.sh` and `create_sample_data.sh` against `localhost:8080`.

**5. Config and env vars** (all have defaults, `application.yml`)
- `DATABASE_URL` (default `jdbc:postgresql://localhost:5433/proppilot`), `DATABASE_USERNAME` (`proppilot`), `DATABASE_PASSWORD` (`proppilot123`).
- `PORT` (8080), `SHOW_SQL` (true), `CORS_ORIGINS`.
- `GOOGLE_CLIENT_ID` (empty, so Google login fails).
- `JWT_SECRET` (dev default), `JWT_EXPIRATION` (24h).
- `SPRING_PROFILES_ACTIVE=local` gives open access with no login.

**6. Run locally**
You need Docker for Postgres on port 5433. Run these commands:
```
cd /Users/juangracia/proppilot-meetup/proppilot/proppilot-backend
docker-compose up -d
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
./populate_database.sh   # optional
```
`./start-backend.sh` does the same steps, but it does not set a profile. Without the local profile, `/api/**` needs a JWT, so the populate scripts g
[result truncated — ask the agent for the rest via SendMessage]
