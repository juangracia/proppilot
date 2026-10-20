---
type: concept
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/service/CurrentUserService.java]
---

# Owner scoping (multi-tenant data)

Each landlord sees only their own data. This is the most important invariant in the backend.

- Every domain entity has an `owner` ([[user-owner]]): [[property-unit]], [[tenant]], [[lease]], [[payment]].
- Repositories look up by id and owner, for example `findByIdAndOwnerId` (`proppilot-backend/src/main/java/com/prop_pilot/service/impl/RentAdjustmentServiceImpl.java:42`).
- Controllers get the owner from `CurrentUserService.getCurrentUser()` / `getCurrentUserId()` (`proppilot-backend/src/main/java/com/prop_pilot/service/CurrentUserService.java:30-71`), for example `proppilot-backend/src/main/java/com/prop_pilot/controller/PropertyUnitController.java:41`, `:53`, `:62`.
- The old `fix-issues.md` command said the same: all queries must filter by `owner_id` (raw domain report, section 6).

## Rule for new code
Any new query or endpoint must take `ownerId` and filter by it. A test should prove that owner A cannot read owner B's record.

Related: [[local-dev-auth]] (which user you are in dev decides which data you see).
