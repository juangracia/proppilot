---
type: architecture
updated: 2026-10-20
sources: [proppilot-backend/Dockerfile, proppilot-backend/railway.json, proppilot-frontend/Dockerfile, raw/2026-10-20-explore-domain.md]
---

# Deploy (Railway)

Production runs on Railway as separate services. The old `fix-issues.md` flow pushed to `main` and waited for the Railway deploy (raw domain report, section 6).

## Backend service
- `proppilot-backend/Dockerfile`: build with `maven:3.9-eclipse-temurin-17` (`mvn clean package -DskipTests`), run on `eclipse-temurin:17-jre`.
- `proppilot-backend/railway.json`: Dockerfile builder, health check `GET /api/countries`, timeout 300 s, restart on failure (max 10).
- `proppilot-backend/Procfile` also exists (`java -Dserver.port=$PORT -jar target/*.jar`). Railway uses the Dockerfile because `railway.json` says so.
- Needs env vars: `DATABASE_URL` (JDBC form), `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ORIGINS`. Railway sets `PORT`.
- UNVERIFIED: the Dockerfile `CMD` uses exec form with `-Dserver.port=${PORT:-8080}`. Exec form does not expand shell variables, so Spring receives the literal text and reads it as placeholder `PORT` with default `-8080`. It works when Railway sets `PORT`, and `application.yml` also maps `server.port: ${PORT:8080}`. Worth a test before relying on the default.
- Railway's Postgres gives `DATABASE_URL` as `postgresql://user:pass@host:port/db`, but the backend expects JDBC form (`jdbc:postgresql://...`) (raw tests report). How prod maps it is not in the repo. UNVERIFIED in prod.
- `JWT_SECRET` falls back to an insecure dev default (`proppilot-backend/src/main/resources/application.yml`). Prod must set it.
- `/api/countries` is public, so the health check works without auth (`proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java:33`).
- Frontend: `.env.production` says `VITE_API_URL=/api`, but the Dockerfile overrides it with the hardcoded prod URL.

## Frontend service
- `proppilot-frontend/Dockerfile`: `node:20-alpine`, `npm ci --legacy-peer-deps`, `npm run build`, then `serve -s dist` on `$PORT`.
- Bakes `VITE_API_URL` (prod backend URL) and `VITE_GOOGLE_CLIENT_ID` at build time. Changing the backend URL needs a rebuild.
- `.railwayignore` present.

## Known prod URL
`https://backend-production-1752.up.railway.app/api` (`proppilot-frontend/src/config/api.js:6`).

Related: [[backend]], [[frontend]], [[decisions]].
