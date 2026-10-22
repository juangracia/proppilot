# Glossary

Terms used in code and UI. The UI is Spanish first, with English too.

| Term | Meaning |
| --- | --- |
| Owner (`User`) | The landlord account. Every row belongs to one owner (`owner_id`). |
| PropertyUnit (propiedad) | A rentable unit. |
| Tenant (inquilino) | A person who rents. A lease can have several. |
| Lease (contrato) | Rental contract between a property and one or more tenants. |
| Payment (pago) | Money received against a lease. |
| ICL | Indice para Contratos de Locacion, Argentine rent index (`Lease.java:163`). |
| IPC | Consumer price index (inflation). Supported for adjustment. |
| DOLAR_BLUE / OFICIAL / MEP | Exchange-rate indexes. Listed in the enum, not supported yet. |
| NONE | No adjustment. |
| Adjusted rent (alquiler ajustado) | Base rent times an index factor. See [rent-adjustment](rent-adjustment.md). |
| Soft delete | Lease flag `deleted=true` plus `deleted_at`. Can be restored. |
| Terminate / reactivate | Status change to TERMINATED, and back. |
| Profile `local` | Spring profile with no auth and a dev user. |

Sources: `proppilot-backend/src/main/java/com/prop_pilot/entity/Lease.java`, [explorer findings](../raw/2026-10-22-explorer-findings.md).
