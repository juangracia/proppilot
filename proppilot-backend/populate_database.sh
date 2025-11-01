#!/bin/bash

# PropPilot Database Population Script
# Creates 10 properties, tenants, and sample payments

set -e  # Exit on any error

echo "🏠 Populating PropPilot Database with Sample Data..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8080/api"

# Function to create a tenant
create_tenant() {
    local name="$1"
    local national_id="$2"
    local email="$3"
    local phone="$4"
    
    curl -s -X POST "${API_BASE}/tenants" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"$name\",
            \"nationalId\": \"$national_id\",
            \"email\": \"$email\",
            \"phone\": \"$phone\"
        }" | jq -r '.id'
}

# Function to create a property unit
create_property() {
    local address="$1"
    local type="$2"
    local rent="$3"
    local lease_date="$4"
    local tenant_id="$5"
    
    local tenant_json=""
    if [ "$tenant_id" != "null" ] && [ -n "$tenant_id" ]; then
        tenant_json=", \"tenant\": {\"id\": $tenant_id}"
    fi
    
    curl -s -X POST "${API_BASE}/property-units" \
        -H "Content-Type: application/json" \
        -d "{
            \"address\": \"$address\",
            \"type\": \"$type\",
            \"baseRentAmount\": $rent,
            \"leaseStartDate\": \"$lease_date\"$tenant_json
        }" | jq -r '.id'
}

# Function to create a payment
create_payment() {
    local property_id="$1"
    local amount="$2"
    local date="$3"
    local type="$4"
    local description="$5"
    
    curl -s -X POST "${API_BASE}/payments" \
        -H "Content-Type: application/json" \
        -d "{
            \"propertyUnit\": {\"id\": $property_id},
            \"amount\": $amount,
            \"paymentDate\": \"$date\",
            \"paymentType\": \"$type\",
            \"description\": \"$description\"
        }" > /dev/null
}

echo -e "${BLUE}📝 Creating Tenants...${NC}"

# Create 10 tenants
tenant1=$(create_tenant "John Smith" "12345678901" "john.smith@email.com" "+1-555-0101")
tenant2=$(create_tenant "Maria Garcia" "23456789012" "maria.garcia@email.com" "+1-555-0102")
tenant3=$(create_tenant "David Johnson" "34567890123" "david.johnson@email.com" "+1-555-0103")
tenant4=$(create_tenant "Sarah Wilson" "45678901234" "sarah.wilson@email.com" "+1-555-0104")
tenant5=$(create_tenant "Michael Brown" "56789012345" "michael.brown@email.com" "+1-555-0105")
tenant6=$(create_tenant "Jennifer Davis" "67890123456" "jennifer.davis@email.com" "+1-555-0106")
tenant7=$(create_tenant "Robert Miller" "78901234567" "robert.miller@email.com" "+1-555-0107")
tenant8=$(create_tenant "Lisa Anderson" "89012345678" "lisa.anderson@email.com" "+1-555-0108")
tenant9=$(create_tenant "James Taylor" "90123456789" "james.taylor@email.com" "+1-555-0109")
tenant10=$(create_tenant "Amanda White" "01234567890" "amanda.white@email.com" "+1-555-0110")

echo -e "${GREEN}✅ Created 10 tenants${NC}"

echo -e "${BLUE}🏠 Creating Property Units...${NC}"

# Create 10 property units with different types and rents
property1=$(create_property "123 Oak Street, Apt 2A" "Apartment" "1850.00" "2023-08-01" "$tenant1")
property2=$(create_property "456 Pine Avenue" "House" "2100.00" "2023-09-15" "$tenant2")
property3=$(create_property "789 Maple Drive" "House" "2850.00" "2023-07-01" "$tenant3")
property4=$(create_property "321 Elm Street, Unit 5" "Apartment" "1650.00" "2023-10-01" "$tenant4")
property5=$(create_property "654 Cedar Lane" "Townhouse" "1950.00" "2023-06-15" "$tenant5")
property6=$(create_property "987 Birch Court" "Townhouse" "2450.00" "2023-11-01" "$tenant6")
property7=$(create_property "147 Willow Way, Apt 3B" "Apartment" "1750.00" "2023-05-01" "$tenant7")
property8=$(create_property "258 Spruce Street" "House" "3200.00" "2023-12-01" "$tenant8")
property9=$(create_property "369 Aspen Drive, Unit 12" "Apartment" "1600.00" "2024-01-15" "$tenant9")
property10=$(create_property "741 Redwood Circle" "Townhouse" "2250.00" "2024-02-01" "$tenant10")

echo -e "${GREEN}✅ Created 10 property units${NC}"

echo -e "${BLUE}💰 Creating Sample Payments...${NC}"

# Create multiple payments for each property (rent, deposits, maintenance, etc.)

# Property 1 - Oak Street Apartment
create_payment "$property1" "2500.00" "2023-08-01" "DEPOSIT" "Security deposit"
create_payment "$property1" "1850.00" "2023-08-01" "RENT" "August rent payment"
create_payment "$property1" "1850.00" "2023-09-01" "RENT" "September rent payment"
create_payment "$property1" "1850.00" "2023-10-01" "RENT" "October rent payment"
create_payment "$property1" "1850.00" "2023-11-01" "RENT" "November rent payment"
create_payment "$property1" "1850.00" "2023-12-01" "RENT" "December rent payment"
create_payment "$property1" "1850.00" "2024-01-01" "RENT" "January rent payment"

# Property 2 - Pine Avenue House
create_payment "$property2" "3000.00" "2023-09-15" "DEPOSIT" "Security deposit"
create_payment "$property2" "2100.00" "2023-09-15" "RENT" "September rent payment"
create_payment "$property2" "2100.00" "2023-10-15" "RENT" "October rent payment"
create_payment "$property2" "2100.00" "2023-11-15" "RENT" "November rent payment"
create_payment "$property2" "2100.00" "2023-12-15" "RENT" "December rent payment"
create_payment "$property2" "150.00" "2023-10-20" "MAINTENANCE" "Plumbing repair"

# Property 3 - Maple Drive House
create_payment "$property3" "4000.00" "2023-07-01" "DEPOSIT" "Security deposit"
create_payment "$property3" "2850.00" "2023-07-01" "RENT" "July rent payment"
create_payment "$property3" "2850.00" "2023-08-01" "RENT" "August rent payment"
create_payment "$property3" "2850.00" "2023-09-01" "RENT" "September rent payment"
create_payment "$property3" "2850.00" "2023-10-01" "RENT" "October rent payment"
create_payment "$property3" "300.00" "2023-08-15" "MAINTENANCE" "HVAC service"
create_payment "$property3" "120.00" "2023-09-10" "UTILITY" "Water bill"

# Property 4 - Elm Street Apartment
create_payment "$property4" "2200.00" "2023-10-01" "DEPOSIT" "Security deposit"
create_payment "$property4" "1650.00" "2023-10-01" "RENT" "October rent payment"
create_payment "$property4" "1650.00" "2023-11-01" "RENT" "November rent payment"
create_payment "$property4" "1650.00" "2023-12-01" "RENT" "December rent payment"

# Property 5 - Cedar Lane Townhouse
create_payment "$property5" "2800.00" "2023-06-15" "DEPOSIT" "Security deposit"
create_payment "$property5" "1950.00" "2023-06-15" "RENT" "June rent payment"
create_payment "$property5" "1950.00" "2023-07-15" "RENT" "July rent payment"
create_payment "$property5" "1950.00" "2023-08-15" "RENT" "August rent payment"
create_payment "$property5" "1950.00" "2023-09-15" "RENT" "September rent payment"
create_payment "$property5" "200.00" "2023-07-20" "MAINTENANCE" "Landscaping"

# Property 6 - Birch Court Townhouse
create_payment "$property6" "3500.00" "2023-11-01" "DEPOSIT" "Security deposit"
create_payment "$property6" "2450.00" "2023-11-01" "RENT" "November rent payment"
create_payment "$property6" "2450.00" "2023-12-01" "RENT" "December rent payment"
create_payment "$property6" "2450.00" "2024-01-01" "RENT" "January rent payment"

# Property 7 - Willow Way Apartment
create_payment "$property7" "2400.00" "2023-05-01" "DEPOSIT" "Security deposit"
create_payment "$property7" "1750.00" "2023-05-01" "RENT" "May rent payment"
create_payment "$property7" "1750.00" "2023-06-01" "RENT" "June rent payment"
create_payment "$property7" "1750.00" "2023-07-01" "RENT" "July rent payment"
create_payment "$property7" "1750.00" "2023-08-01" "RENT" "August rent payment"
create_payment "$property7" "80.00" "2023-06-15" "UTILITY" "Electric bill"

# Property 8 - Spruce Street House
create_payment "$property8" "4500.00" "2023-12-01" "DEPOSIT" "Security deposit"
create_payment "$property8" "3200.00" "2023-12-01" "RENT" "December rent payment"
create_payment "$property8" "3200.00" "2024-01-01" "RENT" "January rent payment"
create_payment "$property8" "500.00" "2023-12-15" "MAINTENANCE" "Roof repair"

# Property 9 - Aspen Drive Apartment
create_payment "$property9" "2200.00" "2024-01-15" "DEPOSIT" "Security deposit"
create_payment "$property9" "1600.00" "2024-01-15" "RENT" "January rent payment"
create_payment "$property9" "1600.00" "2024-02-15" "RENT" "February rent payment"

# Property 10 - Redwood Circle Townhouse
create_payment "$property10" "3200.00" "2024-02-01" "DEPOSIT" "Security deposit"
create_payment "$property10" "2250.00" "2024-02-01" "RENT" "February rent payment"
create_payment "$property10" "2250.00" "2024-03-01" "RENT" "March rent payment"

echo -e "${GREEN}✅ Created sample payments for all properties${NC}"

echo ""
echo -e "${GREEN}🎉 Database population completed successfully!${NC}"
echo ""
echo "📊 Summary:"
echo "   • 10 Tenants created"
echo "   • 10 Property Units created"
echo "   • 50+ Payment records created"
echo ""
echo "🔍 You can now:"
echo "   • View data in DBeaver (PropPilot PostgreSQL connection)"
echo "   • Access the API at http://localhost:8080/api"
echo "   • Use the frontend at http://localhost:5173"
echo ""
echo -e "${BLUE}Happy testing! 🚀${NC}"
