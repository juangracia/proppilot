# Business rules

Every rule below was checked against the file and line. Errors use `BusinessLogicException`, which returns HTTP 422 (`GlobalExceptionHandler.java:63`). See [api](api.md).

Paths: `S` = `proppilot-backend/src/main/java/com/prop_pilot/service/impl/`.

## Lease

- At least one tenant (`S/LeaseServiceImpl.java:57-58`).
- Property unit required (`:62-63`).
- Start and end dates required (`:82-83`).
- End date must be after start date (`:85-86`).
- At least 30 days between start and end (`:89-91`).
- No overlap with another ACTIVE, non-deleted lease on the same property. Overlap means `start <= otherEnd AND end >= otherStart` (`repository/LeaseRepository.java:101-102`). Checked on create (`LeaseServiceImpl.java:95-96`) and update (`:195-196`).
- Terminate sets status TERMINATED, no other checks (`:233-238`).
- Reactivate: only from TERMINATED (`:244-245`). Fails if an overlap exists (`:249-250`). If the end date is past, the new status is EXPIRED, else ACTIVE (`:254-258`).
- Hard delete is blocked when the lease has payments (`:267-269`). Use terminate instead.
- Soft delete and restore exist. Restore re-checks overlap (`:292-293`). Permanent delete only works on soft-deleted leases (`:308-309`).

## Payment

- A lease is required (`S/PaymentServiceImpl.java:42-43`).
- Date is not before the lease start (`:54-55`).
- Date is not in the future: `@PastOrPresent` on the entity (`entity/Payment.java:42`).
- Amount is at most 3 times the base `monthlyRent` (`PaymentServiceImpl.java:60-63`). It uses base rent, not adjusted rent.
- Outstanding list = payments with status PENDING (`:145-146`). Outstanding amount = base rent times months elapsed minus paid RENT payments, never below zero (`:171-181`).

## Tenant and property

- Delete a tenant: blocked when non-deleted leases exist (`S/TenantServiceImpl.java:96-98`). Message is in Spanish.
- Delete a property: same rule (`S/PropertyUnitServiceImpl.java:74-77`).
- Create tenant: duplicate national ID or email throws `IllegalArgumentException` (`TenantServiceImpl.java:35-39`). That is not a `BusinessLogicException`, so see [known issues](known-issues.md).

## Ownership

All reads and writes take an `ownerId` and use `findByIdAndOwnerId`-style queries (for example `LeaseServiceImpl.java:130`, `PaymentServiceImpl.java:49`).

Sources: files cited inline.
