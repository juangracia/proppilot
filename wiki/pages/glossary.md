---
type: glossary
updated: 2026-10-20
sources: [raw/2026-10-20-explore-domain.md, proppilot-frontend/src/contexts/LanguageContext.jsx]
---

# Glossary (es / en)

UI strings live in `proppilot-frontend/src/contexts/LanguageContext.jsx`.

| Español (UI) | English (code) | Notes |
|---|---|---|
| Propiedad | PropertyUnit | [[property-unit]] |
| Inquilino | Tenant | [[tenant]] |
| Contrato | Lease | [[lease]] |
| Pago | Payment | [[payment]] |
| Propietario | User / owner | [[user-owner]] |
| Alquiler base / mensual | baseRentAmount / monthlyRent | |
| Alquiler ajustado | adjusted rent | [[rent-adjustment]] |
| Factor de ajuste acumulado | cumulative adjustment factor | |
| Índice de ajuste | adjustmentIndex | |
| ICL | Índice para Contratos de Locación | BCRA rental index |
| IPC | Índice de Precios al Consumidor | consumer price index (INDEC) |
| Dólar blue / oficial / MEP | DOLAR_BLUE / DOLAR_OFICIAL / DOLAR_MEP | informal / official / stock-market USD rate. Not supported yet. |
| Sin ajuste | NONE | fixed rent |
| Mensual / Bimestral / Trimestral / Semestral / Anual | adjustmentFrequencyMonths 1 / 2 / 3 / 6 / 12 | |
| Activo / Vencido / Terminado | ACTIVE / EXPIRED / TERMINATED | [[lease-lifecycle]] |
| Pagado / Pendiente | PAID / PENDING | |
| Depósito / Mantenimiento / Servicios / Otro | DEPOSIT / MAINTENANCE / UTILITY / OTHER | payment types. RENT = Alquiler |
| DNI | national ID (person) | stored in `nationalId` |
| CUIT | tax ID (person or company) | also stored in `nationalId` |
| PH | Propiedad Horizontal | a unit in a shared lot, often a house behind another |
| Sin asignar | unassigned | lease with no tenant |
| Panel de control | dashboard | |
