# Rent adjustment

Computed on demand by `RentAdjustmentServiceImpl.computeAdjustedRent` (`service/impl/RentAdjustmentServiceImpl.java:42`). Endpoint: `GET /api/leases/{id}/adjusted-rent` (`controller/LeaseController.java:35`).

## Algorithm

1. Load the lease for the owner. Missing lease throws `ResourceNotFoundException` (`:43-44`).
2. Only ICL and IPC are supported (`:25-26`). Other indexes (NONE, DOLAR_*) return base rent with `hasAdjustment=false` (`:50-55`). Non-NONE unsupported indexes log a warning.
3. Country is the lease country, default `AR` (`:48`, `:30`).
4. Find the latest index value on or before the lease start date, and on or before `asOfDate` (`:57-58`). Lookup is `IndexValueServiceImpl.java:22-25`.
5. If either is missing, return base rent with `hasAdjustment=false` (`:60-64`).
6. `factor = current / start`, scale 4, HALF_UP (`:66-67`). `adjusted = base * factor`, scale 2, HALF_UP (`:68`).
7. Response: lease id, base, adjusted, factor, index name, date of the current index value, `true` (`:70-78`).

The factor is cumulative from lease start. `adjustmentFrequencyMonths` is stored but never read (grep finds only `Lease.java:68`), so the adjusted rent changes monthly as new index values arrive, not on the contract anniversary.

## Fresh database

Nothing in the code or the shell scripts inserts into `index_values`. So on a new DB every lease shows `hasAdjustment=false`. The harness `scripts/seed.sh` adds synthetic index rows (tagged synthetic) for demos.

## Tests

`RentAdjustmentServiceImplTest` covers ICL happy path, fallback to previous month, NONE, missing start index, dollar index, and lease not found (`proppilot-backend/src/test/java/com/prop_pilot/service/RentAdjustmentServiceImplTest.java:62-140`).

## History

KAN-36: adjusted rent shown in lease detail and payment form. Landed in dc7daa6 (#34), after an earlier revert of #33.

Sources: files cited inline, [explorer findings](../raw/2026-10-22-explorer-findings.md).
