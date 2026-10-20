---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/Payment.java, proppilot-backend/src/main/java/com/prop_pilot/service/impl/PaymentServiceImpl.java]
---

# Payment (Pago)

Money received against a [[lease]].

## Fields (`proppilot-backend/src/main/java/com/prop_pilot/entity/Payment.java`)
- `lease` (`:27`), `owner` (`:32`), `amount` (`:38`), `paymentDate` (`:43`), `description` (max 500, `:51`).
- `paymentType`: `RENT` (default), `DEPOSIT`, `MAINTENANCE`, `UTILITY`, `OTHER` (`:47`, enum `:141`).
- `status`: `PAID` (default) or `PENDING` (`:55`, enum `:149`). There is no `OVERDUE` state, even though the UI has a "Vencido" label.
- Index snapshot: `indexType`, `indexValueAtPayment`, `indexDate` (`:59-65`). Nothing writes them yet. See [[open-questions]].
- Input: clients send `leaseId` (`:69`).

## Rules (`proppilot-backend/src/main/java/com/prop_pilot/service/impl/PaymentServiceImpl.java`)
- A lease is required (`:43`).
- Date cannot be before the lease start (`:55`).
- Amount cannot exceed 3 times `monthlyRent` (`:61-63`).
- Outstanding balance = `monthlyRent * (months between start and today + 1) - sum(RENT payments)`, floor 0 (`:158-182`). Uses the base rent, not the [[rent-adjustment]].
- A lease with payments cannot be deleted. See [[lease-lifecycle]].
