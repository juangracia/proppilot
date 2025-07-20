# PropPilot API Testing Guide

This document provides example commands for testing the PropPilot REST API endpoints using curl or Postman.

## Base URL
```
http://localhost:8080/api
```

## Property Units API

### 1. Create a Property Unit
```bash
curl -X POST http://localhost:8080/api/property-units \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main Street, Apt 4B",
    "type": "Apartment",
    "baseRentAmount": 1500.00,
    "leaseStartDate": "2024-01-01"
  }'
```

### 2. Get All Property Units
```bash
curl -X GET http://localhost:8080/api/property-units
```

### 3. Get Property Unit by ID
```bash
curl -X GET http://localhost:8080/api/property-units/1
```

### 4. Search Property Units by Address
```bash
curl -X GET "http://localhost:8080/api/property-units/search?address=Main"
```

### 5. Update Property Unit
```bash
curl -X PUT http://localhost:8080/api/property-units/1 \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main Street, Apt 4B",
    "type": "Apartment",
    "baseRentAmount": 1600.00,
    "leaseStartDate": "2024-01-01"
  }'
```

### 6. Delete Property Unit
```bash
curl -X DELETE http://localhost:8080/api/property-units/1
```

## Payments API

### 1. Create a Payment
```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "propertyUnit": {"id": 1},
    "amount": 1500.00,
    "paymentDate": "2024-01-15",
    "paymentType": "RENT",
    "description": "January rent payment"
  }'
```

### 2. Get All Payments
```bash
curl -X GET http://localhost:8080/api/payments
```

### 3. Get Payment by ID
```bash
curl -X GET http://localhost:8080/api/payments/1
```

### 4. Get Payments by Property Unit
```bash
curl -X GET http://localhost:8080/api/payments/property-unit/1
```

### 5. Get Payment History for Property Unit
```bash
curl -X GET "http://localhost:8080/api/payments/property-unit/1/history?startDate=2024-01-01&endDate=2024-12-31"
```

## Advanced Payment Calculations

### 1. Calculate Adjusted Rent
```bash
curl -X GET "http://localhost:8080/api/payments/property-unit/1/adjusted-rent?targetDate=2024-06-01"
```

### 2. Get Outstanding Payments
```bash
curl -X GET "http://localhost:8080/api/payments/property-unit/1/outstanding?asOfDate=2024-06-01"
```

### 3. Get Total Paid Amount
```bash
curl -X GET "http://localhost:8080/api/payments/property-unit/1/total-paid?startDate=2024-01-01&endDate=2024-12-31"
```

## Error Handling Examples

### 1. Invalid Property Unit Creation (Missing Required Fields)
```bash
curl -X POST http://localhost:8080/api/property-units \
  -H "Content-Type: application/json" \
  -d '{
    "address": "",
    "type": "A",
    "baseRentAmount": -100.00
  }'
```
**Expected Response:** 400 Bad Request with validation errors

### 2. Invalid Payment Creation (Amount Too High)
```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "propertyUnit": {"id": 1},
    "amount": 5000.00,
    "paymentDate": "2024-01-15",
    "paymentType": "RENT"
  }'
```
**Expected Response:** 400 Bad Request with business logic error

### 3. Resource Not Found
```bash
curl -X GET http://localhost:8080/api/property-units/999
```
**Expected Response:** 404 Not Found

## Payment Types
Available payment types for the `paymentType` field:
- `RENT` - Regular rent payment
- `DEPOSIT` - Security deposit
- `LATE_FEE` - Late payment fee
- `MAINTENANCE` - Maintenance fee
- `OTHER` - Other payment types

## Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "id": 1,
  "address": "123 Main Street, Apt 4B",
  "type": "Apartment",
  "baseRentAmount": 1500.00,
  "leaseStartDate": "2024-01-01"
}
```

**Error Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/property-units",
  "validationErrors": {
    "address": "Address is required",
    "baseRentAmount": "Base rent amount must be greater than 0"
  }
}
```

## Testing with Postman

1. Import the provided curl commands into Postman
2. Set up environment variables:
   - `BASE_URL`: `http://localhost:8080/api`
3. Create a collection for organized testing
4. Use Postman's test scripts to validate responses

## Notes

- Ensure the backend server is running on `http://localhost:8080`
- PostgreSQL database should be running and accessible
- All date fields use ISO format: `YYYY-MM-DD`
- Decimal amounts use up to 2 decimal places
- Property unit IDs are auto-generated integers starting from 1
