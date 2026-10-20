---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/IndexValue.java, scripts/seed.py]
---

# IndexValue

One published value of an economic index (ICL, IPC) for a country and a date. Input for [[rent-adjustment]].

## Fields (table `index_values`, `proppilot-backend/src/main/java/com/prop_pilot/entity/IndexValue.java`)
- `countryCode` (2 chars), `indexType` (max 20), `value` (precision 18, scale 6), `valueDate`.
- `source` (max 100), `rawResponse` (text), `createdAt`.

## How data gets in
- On this branch, nothing loads real data. No scheduler, no ingestion job, no seed in resources (raw domain report). The ingestion feature was removed in commit `0e5d97f`.
- Local dev: `scripts/seed.py` inserts monthly synthetic values from 2024-01 to today, `source = 'seed-synthetic'`. ICL starts at 10.0 and grows 2.5% per month. IPC starts at 5000.0 and grows 2.2% per month. These are not BCRA or INDEC numbers. See [[decisions]].
- There is no public endpoint for index values. `SecurityConfig` permits `/api/indices/**` (`proppilot-backend/src/main/java/com/prop_pilot/config/SecurityConfig.java:34`), but no controller serves that path on this branch. UNVERIFIED leftover.
