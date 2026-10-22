# Architecture

Two apps in one repo: `proppilot-backend/` (Spring Boot 3.2.0, Java 17) and `proppilot-frontend/` (React 19, Vite 7, MUI 7, JSX).

## Backend

- Package `com.prop_pilot` under `proppilot-backend/src/main/java/`: `config`, `controller`, `dto`, `entity`, `exception`, `repository`, `security`, `service` (interfaces) and `service/impl`.
- Controllers call services, services call Spring Data repositories. Controllers return JPA entities directly.
- Errors: `GlobalExceptionHandler` maps `ResourceNotFoundException` to 404 (`:17`), `ValidationException` and bean validation to 400 (`:30`, `:43`), `BusinessLogicException` to 422 (`:63`), other exceptions to 500 (`:76`, `:88`). Path: `exception/GlobalExceptionHandler.java`.
- Database: PostgreSQL 15. No Flyway. `ddl-auto: update` (`application.yml:9`) plus raw ALTER statements run at startup by `config/DatabaseMigrationRunner.java` (for example `:51`).
- Owner scoping: `CurrentUserService` supplies the owner id. Services take `ownerId` on every call.

## Auth and profiles

- Production: Google ID token to `POST /api/auth/google`, backend issues its own HS256 JWT (`security/JwtUtil.java`, filter `security/JwtAuthenticationFilter.java`). JWT secret and expiry come from env with dev defaults (`application.yml:36-37`).
- `SecurityConfig` has two chains. `@Profile("!local")` (`SecurityConfig.java:24`) requires auth for `/api/**` except auth, countries, indices, swagger (`:31-37`). `@Profile("local")` (`:46`) permits all.
- Local profile adds `POST /api/auth/local` (`AuthController.java:62`) and a dev user from `app.local-dev.email` (`application-local.yml:5-7`).
- CORS: `CorsConfig` is the live config (`SecurityConfig.java:27`). Allowed methods exclude PATCH (`CorsConfig.java:27`). Origins come from `CORS_ORIGINS` (`:19`).

## Frontend

- `src/App.jsx` holds a `selectedView` integer (`:55`) and renders views. There is no router.
- Components in `src/components/` call the API with axios directly. Base URL in `src/config/api.js`: native app uses a hardcoded Railway URL (`:6`), web uses `VITE_API_URL` or `/api` (`:9`).
- Vite dev server on port 3000, proxying `/api` to `localhost:8080`.
- Token: `localStorage['token']`.
- i18n: `src/contexts/LanguageContext.jsx`, `es` block starts at `:18`, `en` at `:466`. Add every string to both.
- Capacitor wraps the web app for mobile.

## Ports and config

DB 5433, backend 8080, frontend 3000 (see `.dev.env`). Backend env: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `CORS_ORIGINS`, `PORT`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `JWT_EXPIRATION`. Frontend env: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

## Deploy

Railway, one `railway up` per folder. Only on explicit human word. See `.claude/skills/deploy`.

Sources: files cited inline, [explorer findings](../raw/2026-10-22-explorer-findings.md).
