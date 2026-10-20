---
source: explore-domain subagent
date: 2026-10-20
branch: demo/part2-cold
commit: 643d5ba
immutable: true
---

PropPilot domain report (branch demo/part2-cold, HEAD 643d5ba). Paths are relative to proppilot-backend/src/main/java/com/prop_pilot unless noted.

1. PRODUCT. A tool for small landlords to manage rentals. The main market is Argentina (README.md:7; Lease.countryCode defaults to "AR" at entity/Lease.java:71; the default UI is Spanish, frontend/src/contexts/LanguageContext.jsx:18). Users sign in with OAuth (entity/User.java:24-27). The system is multi-tenant: every entity has an `owner` User, and every query filters by ownerId (for example, findByIdAndOwnerId in RentAdjustmentServiceImpl.java:43). Commit 72119c9 says "simplify dashboard UX for small property owners".

2. ENTITIES
- PropertyUnit (entity/PropertyUnit.java): address plus structured fields (street, floor, apartment, province...), type (2-50 chars), baseRentAmount (required). It has many Leases. Occupancy is derived from the active lease: getActiveLease() at :83 and activeLeaseId at :104.
- Tenant (entity/Tenant.java): fullName, nationalId (unique, DNI/CUIT), email, phone. It has a many-to-many relation with Lease.
- Lease ("Contrato", entity/Lease.java): one propertyUnit, a Set of tenants (multiple tenants since #9), startDate, endDate, monthlyRent, status, adjustmentIndex (default ICL, :65), adjustmentFrequencyMonths (default 12), countryCode, payments (cascade), and soft delete with deleted/deletedAt (:84-87).
- Payment (entity/Payment.java): lease (required, enforced in the service), amount, paymentDate, paymentType, status, description (max 500). It also has index snapshot fields indexType, indexValueAtPayment, indexDate (:58-65). These fields exist but nothing populates them yet.
- IndexValue (entity/IndexValue.java): countryCode, indexType, value (18,6), valueDate, source, rawResponse.

3. BUSINESS RULES
- LeaseStatus can be ACTIVE, EXPIRED or TERMINATED (Lease.java:156). isActive() = status ACTIVE AND today is within [start, end] (:150).
- Lease validations (service/impl/LeaseServiceImpl.java): at least one tenant (:58), a property is required (:63), end must be after start (:85), the lease must be at least 30 days (:91), no overlapping active lease on the same property (:96), the country must be supported (:107).
- Lease lifecycle: terminate sets TERMINATED (:235). Reactivate works only from TERMINATED and becomes EXPIRED if the end date has passed, otherwise ACTIVE (:244-257). A lease with payments cannot be deleted, so the user must terminate it instead (:269). Delete is soft. Restore checks for overlap (:291). Permanent delete works only on a soft-deleted lease (:312).
- Payment rules (service/impl/PaymentServiceImpl.java): a lease is required (:43). The date cannot be before the lease start (:54). The amount cannot exceed 3x monthlyRent (:60-63). Outstanding = monthlyRent x (months elapsed + 1) - sum of RENT payments, with a floor of 0 (:160-185). This uses the base rent, not the adjusted rent.
- PaymentType can be RENT, DEPOSIT, MAINTENANCE, UTILITY or OTHER. PaymentStatus can be PAID or PENDING (Payment.java:141-152). The UI also has an "Overdue/Vencido" label (LanguageContext.jsx:392), but the backend has no such state.
- A property or tenant cannot be deleted while it has non-deleted leases. The error messages are in Spanish (PropertyUnitServiceImpl.java:77, TenantServiceImpl.java:98).
- Rent adjustment (service/impl/RentAdjustmentServiceImpl.java): only ICL and IPC are supported (:26). factor = index(latest on/before asOf) / index(latest on/before lease start), with scale 4, HALF_UP. adjusted = base x factor, with scale 2 (:57-67). For DOLAR_*, for NONE, or when index data is missing, it returns the base rent with hasAdjustment=false (:51-63). adjustmentFrequencyMonths is NOT used in this calculation, so the adjustment is continuous, not stepped every N months. This is a likely gap. The endpoint is GET /api/leases/{id}/adjusted-rent (controller/LeaseController.java:35). This branch has no scheduler or ingestion for IndexValue: grep finds no @Scheduled and no seed data in resources. The index ingestion feature was removed in 0e5d97f.
- Countries are AR, US, ES, MX, CL, CO, UY, BR and PE, each with a currency (service/CountryConfigService.java:13).

4. GLOSSARY (LanguageContext.jsx)
Propiedad = property unit. Inquilino = tenant. Contrato = lease. Alquiler Base/Mensual = base/monthly rent. Alquiler Ajustado = adjusted rent (:446). Factor de ajuste acumulado = cumulative adjustment factor (:455). Índice de ajuste = adjustment index (:464). ICL = Índice para Contratos de Locación (the BCRA rental index). IPC = consumer price index. Dólar blue/oficial/MEP = informal/official/stock-market USD rates. DNI/CUIT = national ID / tax ID (:91). Activo/Vencido/Terminado = active/expired/terminated (:183-185). Mensual/Bimestral/Trimestral/Semestral = 1/2/3/6-month frequency (:187-190). Depósito/Mantenimiento/Servicios = deposit/maintenance/utility payment (:281-283). Pagado/Pendiente = paid/pending. PH = Propiedad Horizontal (:48). Sin asignar = unassigned (a lease with no tenant).

5. HISTORY. Old GitHub issues #3-#31 were small UX and bug fixes: occupancy derived from the active lease (#7, #19, #22, #29), multiple tenants (#9), dollar indices (#28), and a duration selector (#27). The adjusted-rent feature was built, removed for the meetup (2f8acdd), rebuilt in PR #33, reverted (458357a), and then landed as KAN-36 in PR #34 (dc7daa6): IndexValue entity, RentAdjustmentService, the endpoint, the lease detail card, and payment form prefill. docs/mockups/lease-detail.png and docs/mockups/payment-form.png are the design target. The last commit, 643d5ba, removed .claude/commands/fix-issues.md for a "cold-start demo". A Python/FastAPI backend existed (5488112) but is now untracked. Railway deploys the Java backend. Hints of open work: adjustmentFrequencyMonths is ignored, DOLAR_* indices are unsupported, Payment index snapshot fields are unused, outstanding balance ignores adjustment, and there is no index ingestion.

6. OLD fix-issues.md (origin/main). An autonomous loop over every open GitHub issue, with no questions to the user. For each issue it did these steps: comment that it started, add the in-progress label, explore, fix, add JUnit tests, build (mvnw compile and npm run build), test with Playwright on the happy and error paths, commit "fix: <title> (#N)" directly to main with no PR, then add the ready-for-deploy label. Blocked issues got a blocked label and a comment. After all issues, it pushed to main, waited for the Railway deploy, replayed test data in production with Playwright on the account juanmgracia@gmail.com, then commented and closed each fixed issue. Its notes said that all queries must filter by owner_id.
