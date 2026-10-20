---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/Tenant.java]
---

# Tenant (Inquilino)

A person or company that rents a [[property-unit]].

## Fields
- `fullName` (`proppilot-backend/src/main/java/com/prop_pilot/entity/Tenant.java:28`)
- `nationalId`, unique. Holds a DNI or a CUIT (`Tenant.java:32`). See [[glossary]].
- `email`, `phone` (`Tenant.java:37`, `:41`)
- `owner`: the [[user-owner]] (`Tenant.java:46`)
- `leases`: many-to-many with [[lease]] (`Tenant.java:50`). A lease can have several tenants since issue #9.

## Rules
- Cannot be deleted while on a non-deleted lease (raw domain report, `proppilot-backend/src/main/java/com/prop_pilot/service/impl/TenantServiceImpl.java:98`).
- UNVERIFIED: whether `nationalId` is unique globally or per owner. If global, two landlords cannot register the same tenant. Listed in [[open-questions]].

## API
`/api/tenants`, plus search by national id and email. See [[backend]].
