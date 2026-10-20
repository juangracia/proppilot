---
name: dev-stack
description: Start, seed and troubleshoot the local PropPilot stack (Postgres in Docker, Spring backend on :8080, Vite frontend on :3000). Use before running verify, e2e or checking the UI, or when the backend will not start, Postgres port 5433 is taken, the build fails with Lombok "cannot find symbol", or the UI shows an empty account.
---

# Local dev stack

## Start

```bash
cp .dev.env.example .dev.env          # once; gitignored
scripts/dev-backend.sh                # Postgres container + backend :8080, profile `local` (blocks; run in background)
curl -sf http://localhost:8080/api/countries   # ready check
scripts/seed.py --reset               # wipe + load Argentine demo data (backend must be up)
cd proppilot-frontend && npm ci --legacy-peer-deps && npm run dev   # :3000, proxies /api to :8080
```

URLs: UI http://localhost:3000, API http://localhost:8080/api, Swagger http://localhost:8080/swagger-ui.html.

## Log in to see data

Profile `local` permits every request. With no token the backend acts as `app.local-dev.email` (`proppilot-backend/src/main/resources/application-local.yml`), `juanmgracia@gmail.com`, who owns the seeded data.
In the UI use "Custom User" with `juanmgracia@gmail.com`. Quick-login users (Alice, Bob, Charlie) are other owners and see empty accounts. Details: `wiki/pages/concepts/local-dev-auth.md`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Port 5433 already in use | Set `POSTGRES_PORT=<free port>` in `.dev.env`. Scripts read it. |
| `cannot find symbol` on getters (Lombok) | JDK 25 is active. `scripts/lib/java.sh` picks 17 or 21 and ignores a global `JAVA_HOME`. Force one with `PROPPILOT_JAVA_HOME` in `.dev.env`. `proppilot-backend/.sdkmanrc` pins 17. |
| Backend tests fail on DB connection | `AuthControllerTest` and `DataPortabilityControllerTest` are full `@SpringBootTest`. Start `scripts/dev-backend.sh` first. |
| UI lists are empty | Wrong user (see above), or DB not seeded: run `scripts/seed.py --reset`. |
| No leases or payments after seeding | You ran old `populate_database.sh` / `create_sample_data.sh`. Use `scripts/seed.py`. |

Index values from `seed.py` are synthetic (`source='seed-synthetic'`), not BCRA/INDEC data.
