---
type: open-questions
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, raw/2026-10-20-explore-frontend.md]
---

# Open questions and gaps

Candidates for issues. Each item says what is known and how it was checked.

## Domain gaps
1. **`adjustmentFrequencyMonths` is ignored.** The adjusted rent changes every month with the index, not every N months as the contract says (`proppilot-backend/src/main/java/com/prop_pilot/service/impl/RentAdjustmentServiceImpl.java:40-68`). See [[rent-adjustment]].
2. **Outstanding balance uses base rent.** `calculateOutstandingAmount` multiplies `monthlyRent`, not the adjusted rent (`proppilot-backend/src/main/java/com/prop_pilot/service/impl/PaymentServiceImpl.java:158-182`). See [[payment]].
3. **DOLAR_* indices unsupported.** They return the base rent with a warning (`RentAdjustmentServiceImpl.java:50-53`).
4. **Payment index snapshot unused.** `indexType`, `indexValueAtPayment`, `indexDate` exist but nothing writes them (`proppilot-backend/src/main/java/com/prop_pilot/entity/Payment.java:59-65`).
5. **No index ingestion.** No scheduler or job loads ICL/IPC. Removed in commit `0e5d97f`. Dev uses synthetic data, see [[decisions]].
6. UNVERIFIED: no automatic `ACTIVE` to `EXPIRED` transition. See [[lease-lifecycle]].
7. UNVERIFIED: `Tenant.nationalId` uniqueness may be global, not per owner. See [[tenant]].

## UI
8. **Dashboard "Inquilinos Activos" counts all tenants.** `activeTenants = tenants.length` (`proppilot-frontend/src/components/DashboardView.jsx:75`). With the seed it shows 8, but only 6 tenants are on active leases (seeded 2026-10-20). Needs a product decision: rename the card or count tenants on active leases.
9. "Vencido" (overdue) label in the UI with no backend state for it (raw domain report).

## Engineering
10. Prod backend URL hardcoded in `proppilot-frontend/src/config/api.js:6` and `proppilot-frontend/Dockerfile`.
11. Thin tests and no CI. `scripts/verify.sh` passes (37/37 backend, lint at baseline), but there are no tests for the core services or owner isolation, controller tests need a local DB, and the frontend has no unit tests. See [[testing]].
12. Old seed scripts in `proppilot-backend/` are stale (ADR-003). Delete or fix.
13. Railway's `DATABASE_URL` is `postgresql://...`, not JDBC. Handled: `application.yml:3-6` composes the URL from PG* vars, so do not set `DATABASE_URL` (see [[deploy-railway]]). `JWT_SECRET` still has an insecure default, prod must set it.
15. Railway account: CLI is logged in as the Santex account. UNVERIFIED that it is the intended one. Blocks the deploy.
16. Railway `meetup` env does not exist yet. Needs `railway link` by the user, then the deploy (ADR-006).
17. Meetup frontend domain is not in Google OAuth origins yet. Prod login is Google only, so meetup login fails until it is added.
18. Prod seed needs a token-based `seed.py --token` mode. Not built.
19. Frontend has no `/api` proxy, so `VITE_API_URL` must be the full backend URL. Changing it means a rebuild.
14. `SecurityConfig` permits `/api/indices/**` with no controller behind it. See [[index-value]].
