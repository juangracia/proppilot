#!/bin/bash

# Create sample payments for different properties
echo "Creating sample payments..."

# Property 1 - Multiple rent payments
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 1}, "amount": 1850.00, "paymentDate": "2024-02-15", "paymentType": "RENT", "description": "February rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 1}, "amount": 1850.00, "paymentDate": "2024-03-15", "paymentType": "RENT", "description": "March rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 1}, "amount": 2500.00, "paymentDate": "2024-01-01", "paymentType": "DEPOSIT", "description": "Security deposit"}'

# Property 2 - Pine Avenue
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 2}, "amount": 2100.00, "paymentDate": "2024-01-01", "paymentType": "RENT", "description": "January rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 2}, "amount": 2100.00, "paymentDate": "2024-02-01", "paymentType": "RENT", "description": "February rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 2}, "amount": 3000.00, "paymentDate": "2023-12-01", "paymentType": "DEPOSIT", "description": "Security deposit"}'

# Property 3 - Maple Drive House
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 3}, "amount": 2850.00, "paymentDate": "2024-02-01", "paymentType": "RENT", "description": "February rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 3}, "amount": 2850.00, "paymentDate": "2024-03-01", "paymentType": "RENT", "description": "March rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 3}, "amount": 150.00, "paymentDate": "2024-02-20", "paymentType": "MAINTENANCE", "description": "Plumbing repair"}'

# Property 4 - Elm Street
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 4}, "amount": 1650.00, "paymentDate": "2024-03-15", "paymentType": "RENT", "description": "March rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 4}, "amount": 1650.00, "paymentDate": "2024-04-15", "paymentType": "RENT", "description": "April rent payment"}'

# Property 5 - Cedar Lane
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 5}, "amount": 1950.00, "paymentDate": "2024-01-01", "paymentType": "RENT", "description": "January rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 5}, "amount": 75.00, "paymentDate": "2024-01-20", "paymentType": "LATE_FEE", "description": "Late payment fee"}'

# Property 6 - Birch Court Townhouse
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 6}, "amount": 2450.00, "paymentDate": "2024-01-01", "paymentType": "RENT", "description": "January rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 6}, "amount": 2450.00, "paymentDate": "2024-02-01", "paymentType": "RENT", "description": "February rent payment"}'

# Property 7 - Willow Street
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 7}, "amount": 1750.00, "paymentDate": "2024-04-01", "paymentType": "RENT", "description": "April rent payment"}'

# Property 8 - Spruce Avenue
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 8}, "amount": 1900.00, "paymentDate": "2024-01-15", "paymentType": "RENT", "description": "January rent payment"}'
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 8}, "amount": 200.00, "paymentDate": "2024-01-25", "paymentType": "OTHER", "description": "Pet deposit"}'

# Property 9 - Poplar Street House
curl -X POST http://localhost:8080/api/payments -H "Content-Type: application/json" -d '{"propertyUnit": {"id": 9}, "amount": 3200.00, "paymentDate": "2024-02-15", "paymentType": "RENT", "description": "February rent payment"}'

echo "Sample data creation completed!"
