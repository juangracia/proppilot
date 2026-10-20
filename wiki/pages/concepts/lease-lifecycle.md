---
type: concept
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/service/impl/LeaseServiceImpl.java, proppilot-backend/src/main/java/com/prop_pilot/entity/Lease.java]
---

# Lease lifecycle

States and validations for a [[lease]]. Code: `proppilot-backend/src/main/java/com/prop_pilot/service/impl/LeaseServiceImpl.java`.

## Create and update validations
- At least one tenant (`:58`). Property unit required (`:63`).
- Start and end dates required (`:83`). End after start (`:86`).
- At least 30 days long (`:88-91`, again on update at `:189-192`).
- No overlapping lease on the same property in the period (`:95-96`, update `:195-196`). Overlap check: `hasOverlappingLease` (`:317-322`).
- Country must be supported (`:107`, update `:215`). Countries: AR, US, ES, MX, CL, CO, UY, BR, PE (raw domain report, `proppilot-backend/src/main/java/com/prop_pilot/service/CountryConfigService.java:13`).

## States
```
ACTIVE --terminate--> TERMINATED --reactivate--> ACTIVE (or EXPIRED if endDate passed)
```
- `isActive()` = status `ACTIVE` and today is within start and end (`proppilot-backend/src/main/java/com/prop_pilot/entity/Lease.java:150`).
- Reactivate only from `TERMINATED` (`:245`) and only if no overlap (`:249-250`).
- UNVERIFIED: nothing seen that moves `ACTIVE` to `EXPIRED` automatically when the end date passes (no `@Scheduled`). The status may stay `ACTIVE` while `isActive()` is false.

## Delete
- A lease with payments cannot be deleted. The user must terminate it (`:269`).
- Delete is soft (`deleted`, `deletedAt`). Restore re-checks overlap (`:292-293`). Permanent delete only on a soft-deleted lease (raw domain report, `:312`).
