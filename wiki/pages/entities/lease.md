---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/Lease.java]
---

# Lease (Contrato)

The rental contract. Links one [[property-unit]] to one or more [[tenant]]s and owns the [[payment]]s.

## Fields (`proppilot-backend/src/main/java/com/prop_pilot/entity/Lease.java`)
- `propertyUnit` (required) and `tenants` (set, many-to-many via `lease_tenants`).
- `startDate`, `endDate`, `monthlyRent` (required, > 0).
- `status`: `ACTIVE`, `EXPIRED`, `TERMINATED`. Default `ACTIVE` (`Lease.java:61`, enum at `:156`).
- `adjustmentIndex`: `ICL` (default), `IPC`, `DOLAR_BLUE`, `DOLAR_OFICIAL`, `DOLAR_MEP`, `NONE` (enum at `Lease.java:162-169`).
- `adjustmentFrequencyMonths`, default 12. Not used by the calculation, see [[rent-adjustment]].
- `countryCode`, default `AR` (`Lease.java:71`).
- `deleted`, `deletedAt`: soft delete.
- Write-only JSON inputs: `propertyUnitId`, `tenantIds`. The entity fields are `@JsonIgnore`, so clients send ids.

## Rules
See [[lease-lifecycle]] for validations and state changes.

## API
`/api/leases`, including `GET /{id}/adjusted-rent`, terminate, reactivate, soft delete, restore and permanent delete. See [[backend]].
