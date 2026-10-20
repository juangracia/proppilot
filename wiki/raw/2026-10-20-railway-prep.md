---
source: coordinator message (team-lead), facts verified 2026-10-20
date: 2026-10-20
immutable: true
---

# Railway prep, model policy, skills

1. Railway prep, commit `9f6de6b`. Backend `application.yml` builds the JDBC URL from Railway PG* vars with local fallbacks. `DATABASE_URL` still overrides, so never set it to Railway's `postgres://` URL. Backend Dockerfile CMD is `["java","-jar","app.jar"]`, port from `server.port=${PORT:8080}`. Frontend Dockerfile takes `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` as build ARGs. Both images built locally (backend 55 s, frontend 18 s). Backend image booted against local Postgres: `/api/countries` 200, `/api/property-units` 401. Runbook `docs/deploy-railway.md`, procedure skill `.claude/skills/railway-deploy`.
2. Railway state. CLI 4.11.2 logged in as the Santex account (UNVERIFIED that it is the intended account). Project `proppilot`, env `production` (old live version: backend, frontend, Postgres). Decision: deploy this branch to a NEW empty env `meetup`, fresh Postgres, never touch production. Prod login is Google only (`/auth/local` only in the local profile), so the meetup frontend domain must be added to Google OAuth origins. Seeding prod needs a token-based seed (planned `seed.py --token`). Deploy blocked until the user runs `railway link`.
3. Why `seed.py` exists. `populate_database.sh` and `create_sample_data.sh` predate leases. Running `populate_database.sh` gave 10 properties, 10 tenants, 0 leases, 0 payments. Index ingestion had been removed, so adjusted rent showed nothing. `seed.py` uses the current API.
4. Model policy. Every Agent call sets `model`: haiku for mechanical work, sonnet for bounded code, tests and docs, opus only for hard judgment. PreToolUse hook `.claude/hooks/require-agent-model.sh` denies Agent calls without it. Forks and agents with `model:` in frontmatter are exempt. `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is the fallback. Long independent work (the real deploy) runs in its own session (`claude --bg`).
5. Skills added. Project: `railway-deploy`. Global (outside the repo): `cold-repo-harness`, `obsidian-open-vault`.
