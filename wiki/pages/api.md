---
title: API
type: system
tags: [backend, rest]
sources: [controller/*.java]
updated: 2026-10-22
---

# API

Base path `/api`. Controllers are in `proppilot-backend/src/main/java/com/prop_pilot/controller/`. Swagger UI at `/swagger-ui.html`. Error body shape: `ErrorResponse` (timestamp, status, error, message, path, validationErrors). See [[architecture]] for status mapping.

| Prefix | Controller | Endpoints |
| --- | --- | --- |
| `/api/auth` | `AuthController` | `POST /google` (`:29`), `GET /me` (`:44`), `POST /local` (`:62`, local profile only) |
| `/api/countries` | `CountryController` | `GET` (`:28`), `GET /{code}` (`:35`) |
| `/api/data` | `DataPortabilityController` | `GET /export` (`:30`), `GET /template` (`:50`), `POST /import/preview` (`:66`), `POST /import/execute` (`:78`) |
| `/api/property-units` | `PropertyUnitController` | `POST` (`:34`), `GET` (`:58`), `GET /{id}`, `GET /with-leases`, `GET /search`, `PUT /{id}`, `DELETE /{id}`, `GET /{id}/can-delete` |
| `/api/tenants` | `TenantController` | `POST` (`:34`), `GET` (`:60`), `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /search/national-id/{nationalId}`, `GET /search/email/{email}`, `GET /{id}/can-delete` |
| `/api/leases` | `LeaseController` | `POST` (`:44`), `GET` (`:65`), `GET /{id}`, `GET /{id}/adjusted-rent` (`:35`), `GET /active`, `GET /property-unit/{id}`, `GET /property-unit/{id}/active`, `GET /tenant/{id}`, `GET /tenant/{id}/active`, `PUT /{id}`, `POST /{id}/terminate`, `POST /{id}/reactivate`, `DELETE /{id}` (soft), `GET /deleted`, `POST /{id}/restore`, `DELETE /{id}/permanent` |
| `/api/payments` | `PaymentController` | `POST` (`:34`), `GET` (`:55`), `GET /{id}`, `GET /lease/{id}`, `GET /property-unit/{id}`, `GET /tenant/{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /lease/{id}/outstanding`, `GET /lease/{id}/outstanding-amount`, `GET /lease/{id}/total-paid`, `GET /lease/{id}/history` |
| `/api/delinquency` | `DelinquencyController` | `GET ?asOf=YYYY-MM-DD` (optional, default today): active leases with overdue rent, days overdue, amount owed. Rules in [[business-rules|business rules]] (Delinquency). A malformed `asOf` returns 500 (generic handler). |

`/api/indices/**` is permitted in `SecurityConfig.java:34` but no controller serves it.

Rules behind the 422 responses: [[business-rules|business rules]].

Sources: controller files above.

Related: [[architecture]], [[entities]], [[business-rules]]
