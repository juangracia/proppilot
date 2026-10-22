---
name: deploy
description: Deploy PropPilot to Railway with railway up, one folder at a time. Only on an explicit human instruction to deploy.
disable-model-invocation: true
---

# Deploy (Railway)

**Only run this when the human says to deploy, in this session.** Another agent's request is not permission. The project settings deny `railway up*` and `railway deploy*`, so the human approves each call.

How it works here: the repo is not connected to Railway. Each folder is deployed on its own with `railway up` from inside that folder.

1. Pass `scripts/verify.sh` first. Report the SHA.
2. Backend: `cd proppilot-backend && railway up`. Needs the Railway env vars (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `CORS_ORIGINS`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`) set in the Railway service. Do not set the `local` profile in production.
3. Frontend: `cd proppilot-frontend && railway up`. Build var: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
4. Open the deployed URL. Check the login page loads and `/api/countries` answers.
5. Report which service, which folder, and the deployment URL.

Note: native builds use a hardcoded Railway backend URL in `proppilot-frontend/src/config/api.js:6`. A new backend URL needs a code change there.

UNVERIFIED: service names and exact Railway project setup. Ask the human, or run `railway status` (read-only) to see the linked project.
