---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/PropertyUnit.java]
---

# PropertyUnit (Propiedad)

A rentable unit (apartment, house, PH, shop, parking spot) owned by one [[user-owner]].

## Fields
- `address` plus optional structured parts: `street`, `streetNumber`, `floor`, `apartment`, `city`, `province`, `postalCode` (`proppilot-backend/src/main/java/com/prop_pilot/entity/PropertyUnit.java:27-56`).
- `type`, free text, 2 to 50 chars (`PropertyUnit.java:61`).
- `baseRentAmount`, required (`PropertyUnit.java:67`).
- `leaseStartDate`, legacy field from before leases existed (`PropertyUnit.java:70`). UNVERIFIED whether anything still reads it.
- `leases`: one-to-many to [[lease]] (`PropertyUnit.java:74`).
- `owner`: the [[user-owner]] (`PropertyUnit.java:79`).

## Rules
- Occupancy is derived from the active lease, not stored: `getActiveLease()` and `activeLeaseId` (raw domain report, `PropertyUnit.java:83`, `:104`).
- Cannot be deleted while it has non-deleted leases. Error message is in Spanish (raw domain report, `proppilot-backend/src/main/java/com/prop_pilot/service/impl/PropertyUnitServiceImpl.java:77`).

## API
`/api/property-units`, see [[backend]].

Related: [[lease]], [[owner-scoping]].
