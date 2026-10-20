---
type: concept
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/service/impl/RentAdjustmentServiceImpl.java]
---

# Rent adjustment (Alquiler ajustado)

Argentine leases update the rent by an index. PropPilot computes today's adjusted rent for a [[lease]]. Shipped as KAN-36 in PR #34 (commit `dc7daa6`).

## Formula
`proppilot-backend/src/main/java/com/prop_pilot/service/impl/RentAdjustmentServiceImpl.java:40-68`

```
startIv   = latest IndexValue on or before lease.startDate   (same index type and country)
currentIv = latest IndexValue on or before asOf (today)
factor    = currentIv.value / startIv.value      scale 4, HALF_UP   (:67)
adjusted  = lease.monthlyRent * factor           scale 2, HALF_UP   (:68)
```

- Only `ICL` and `IPC` are supported (`:25-26`).
- `DOLAR_*` and `NONE`, or missing index data, return the base rent with `hasAdjustment=false` (`:50-63`). `DOLAR_*` logs a warning.
- `adjustmentFrequencyMonths` is not used. The adjustment is continuous (every month), not stepped every N months as real contracts do. See [[open-questions]].
- Endpoint: `GET /api/leases/{id}/adjusted-rent`. Response: `leaseId, baseAmount, adjustedAmount, factor, indexType, indexDate, hasAdjustment`.
- Index data: see [[index-value]].

## Verified on 2026-10-20 (local, seeded)
Lease 1 (Av. Santa Fe 2450, ICL, start 2025-03-01, base 450000) with synthetic ICL growing 2.5% per month:
- 19 months from 2025-03 to 2026-10, so `1.025^19 = 1.5987`.
- API returned `{"baseAmount":450000.00,"adjustedAmount":719415.00,"factor":1.5987,"indexType":"ICL","indexDate":"2026-10-01","hasAdjustment":true}`.
- 450000 x 1.5987 = 719415. Matches.
- The lease detail dialog shows the "Alquiler ajustado a hoy (ICL · Anual)" card.

## Design target
`docs/mockups/lease-detail.png`, `docs/mockups/payment-form.png` (raw domain report).

Related: [[payment]] (outstanding balance ignores the adjustment).
