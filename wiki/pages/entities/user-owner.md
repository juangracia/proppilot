---
type: entity
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-backend/src/main/java/com/prop_pilot/entity/User.java]
---

# User (owner)

The landlord using the app. Every domain record has an `owner` that points here.

## Fields (`proppilot-backend/src/main/java/com/prop_pilot/entity/User.java`)
- `email` (`:16`), `fullName` (`:19`), `pictureUrl` (`:21`).
- `provider` and `providerId` (`:24`, `:27`): `google` in production, `local` in dev.
- `createdAt`, `lastLoginAt`.

## Notes
- Users are created on first login (Google) or on first request in the `local` profile. See [[local-dev-auth]].
- All data is scoped to the owner. See [[owner-scoping]].
