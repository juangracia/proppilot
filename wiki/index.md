---
type: index
updated: 2026-10-20
---

# PropPilot wiki index

Read this first. Rules for maintaining the wiki: [[AGENTS]]. History: [[log]].
Pattern: Karpathy's LLM Wiki, https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## Entities
- [[property-unit]]: a rentable unit (Propiedad). Occupancy comes from its active lease.
- [[tenant]]: person or company renting (Inquilino). DNI or CUIT in `nationalId`.
- [[lease]]: the contract (Contrato). Property, tenants, dates, rent, index, status.
- [[payment]]: money against a lease (Pago). Types, statuses, 3x rent cap, outstanding formula.
- [[index-value]]: ICL/IPC values by country and date. Dev data is synthetic.
- [[user-owner]]: the landlord. Owns every record.

## Concepts
- [[rent-adjustment]]: adjusted rent formula, supported indices, verified example (450000 to 719415).
- [[lease-lifecycle]]: validations, ACTIVE / TERMINATED / EXPIRED, soft delete.
- [[owner-scoping]]: every query filters by owner. Main backend invariant.
- [[local-dev-auth]]: local profile, `/auth/local`, and why Alice sees an empty account.

## Architecture
- [[backend]]: Spring Boot 3.2 on Java 17, Postgres, endpoints, config, how to run.
- [[frontend]]: React 19 + Vite + MUI, no router, axios inline, Capacitor.
- [[deploy-railway]]: Dockerfiles, PG* vars (never set DATABASE_URL to Railway's value), build ARGs, `meetup` env plan, blocked on `railway link`.
- [[testing]]: `scripts/verify.sh`, current results (backend 37/37, lint at baseline, e2e smoke 2/2), gaps.
- [[harness]]: Claude Code setup. Memory split (CLAUDE.md, wiki, local, auto memory), skills, subagents, SessionStart hook.

## Reference
- [[glossary]]: Spanish UI terms to English code names.
- [[decisions]]: ADR log (JDK 17, Postgres port, new seeder, synthetic index data, 401 for unauthenticated, Railway `meetup` env, model on every Agent call).
- [[open-questions]]: domain gaps, UI bugs, engineering debt.

## Raw sources (`raw/`, immutable)
- `raw/2026-10-20-explore-backend.md`: backend exploration report (truncated at section 6).
- `raw/2026-10-20-explore-frontend.md`: frontend exploration report.
- `raw/2026-10-20-explore-domain.md`: domain exploration report.
- `raw/2026-10-20-explore-tests.md`: tests, CI and Railway readiness report.
- `raw/2026-10-20-railway-prep.md`: Railway prep (9f6de6b), Railway state, seed.py reason, model policy, skills.
