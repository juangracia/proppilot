---
title: Entities and relationships
type: entity
tags: [domain, data-model]
sources: [entity/*.java, 2026-10-22-explorer-findings]
updated: 2026-10-22
---

# Entities and relationships

Six JPA entities in `proppilot-backend/src/main/java/com/prop_pilot/entity/`. Controllers return entities directly (no response DTO layer except `AdjustedRentResponse`).

| Entity | Table | Notes |
| --- | --- | --- |
| `User` | users | Owner. Created from Google login or the local dev user. |
| `PropertyUnit` | property_units | `@OneToMany` leases (`PropertyUnit.java:72`), owner (`:76`). |
| `Tenant` | tenants | `nationalId` is unique (`Tenant.java:30-32`). `@ManyToMany(mappedBy="tenants")` leases (`:48`). |
| `Lease` | leases | `@ManyToOne` propertyUnit (`Lease.java:31`), `@ManyToMany` tenants via join table `lease_tenants` (`:36`), `@OneToMany` payments (`:73`), owner (`:77`). Soft delete: `deleted`, `deletedAt` (`:84`, `:87`). |
| `Payment` | payments | `@ManyToOne` lease (`Payment.java:22`) and owner (`:29`). |
| `IndexValue` | index_values | Monthly index data: `indexType`, `countryCode`, `valueDate`, `value` (`IndexValue.java`). No FK to other tables. |

## Relationships

```
User 1--* PropertyUnit 1--* Lease *--* Tenant
User 1--* Tenant         Lease 1--* Payment
IndexValue (standalone, looked up by type + country + date)
```

## Lease fields that matter

- `status`: ACTIVE, EXPIRED, TERMINATED (`Lease.java:61`, `:156-160`). Default ACTIVE.
- `adjustmentIndex`: default ICL (`:65`). `adjustmentFrequencyMonths`: default 12 (`:68`), not used by any code.
- `monthlyRent`: at least 0.01, 8 integer digits, 2 decimals (`:55-57`).
- `isActive()` is true when status is ACTIVE and today is inside the dates (`:150`).

Sources: entity files above, [[2026-10-22-explorer-findings|explorer findings]].

Related: [[glossary]], [[business-rules]], [[api]]
