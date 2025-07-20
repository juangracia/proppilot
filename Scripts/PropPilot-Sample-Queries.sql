-- PropPilot Database Sample Queries
-- Use these queries to explore the PropPilot rental property management data

-- =============================================================================
-- BASIC DATA EXPLORATION
-- =============================================================================

-- View all property units
SELECT * FROM property_units ORDER BY id;

-- View all payments
SELECT * FROM payments ORDER BY payment_date DESC;

-- Count of properties and payments
SELECT 
    (SELECT COUNT(*) FROM property_units) as total_properties,
    (SELECT COUNT(*) FROM payments) as total_payments;

-- =============================================================================
-- PROPERTY ANALYSIS
-- =============================================================================

-- Properties by type
SELECT 
    type,
    COUNT(*) as count,
    AVG(base_rent_amount) as avg_rent,
    MIN(base_rent_amount) as min_rent,
    MAX(base_rent_amount) as max_rent
FROM property_units 
GROUP BY type 
ORDER BY avg_rent DESC;

-- Properties with their total payments received
SELECT 
    pu.id,
    pu.address,
    pu.type,
    pu.base_rent_amount,
    COUNT(p.id) as payment_count,
    COALESCE(SUM(p.amount), 0) as total_received
FROM property_units pu
LEFT JOIN payments p ON pu.id = p.property_unit_id
GROUP BY pu.id, pu.address, pu.type, pu.base_rent_amount
ORDER BY total_received DESC;

-- =============================================================================
-- PAYMENT ANALYSIS
-- =============================================================================

-- Payments by type
SELECT 
    payment_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments 
GROUP BY payment_type 
ORDER BY total_amount DESC;

-- Monthly payment summary
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments 
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

-- Recent payments (last 30 days)
SELECT 
    p.id,
    pu.address,
    p.amount,
    p.payment_date,
    p.payment_type,
    p.description
FROM payments p
JOIN property_units pu ON p.property_unit_id = pu.id
WHERE p.payment_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY p.payment_date DESC;

-- =============================================================================
-- FINANCIAL REPORTS
-- =============================================================================

-- Property performance report
SELECT 
    pu.address,
    pu.base_rent_amount as monthly_rent,
    COUNT(CASE WHEN p.payment_type = 'RENT' THEN 1 END) as rent_payments,
    SUM(CASE WHEN p.payment_type = 'RENT' THEN p.amount ELSE 0 END) as rent_received,
    SUM(CASE WHEN p.payment_type = 'DEPOSIT' THEN p.amount ELSE 0 END) as deposits_received,
    SUM(CASE WHEN p.payment_type = 'MAINTENANCE' THEN p.amount ELSE 0 END) as maintenance_fees,
    SUM(p.amount) as total_received
FROM property_units pu
LEFT JOIN payments p ON pu.id = p.property_unit_id
GROUP BY pu.id, pu.address, pu.base_rent_amount
ORDER BY total_received DESC;

-- Outstanding rent analysis (properties with fewer rent payments than expected)
SELECT 
    pu.id,
    pu.address,
    pu.base_rent_amount,
    pu.lease_start_date,
    COUNT(CASE WHEN p.payment_type = 'RENT' THEN 1 END) as rent_payments_made,
    -- Calculate expected payments based on lease start date
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, pu.lease_start_date)) + 1 as expected_payments,
    (EXTRACT(MONTH FROM AGE(CURRENT_DATE, pu.lease_start_date)) + 1) - 
    COUNT(CASE WHEN p.payment_type = 'RENT' THEN 1 END) as payments_behind
FROM property_units pu
LEFT JOIN payments p ON pu.id = p.property_unit_id
WHERE pu.lease_start_date <= CURRENT_DATE
GROUP BY pu.id, pu.address, pu.base_rent_amount, pu.lease_start_date
HAVING (EXTRACT(MONTH FROM AGE(CURRENT_DATE, pu.lease_start_date)) + 1) - 
       COUNT(CASE WHEN p.payment_type = 'RENT' THEN 1 END) > 0
ORDER BY payments_behind DESC;

-- =============================================================================
-- MAINTENANCE AND FEES
-- =============================================================================

-- Properties with maintenance expenses
SELECT 
    pu.address,
    COUNT(p.id) as maintenance_count,
    SUM(p.amount) as total_maintenance_cost,
    AVG(p.amount) as avg_maintenance_cost
FROM property_units pu
JOIN payments p ON pu.id = p.property_unit_id
WHERE p.payment_type = 'MAINTENANCE'
GROUP BY pu.id, pu.address
ORDER BY total_maintenance_cost DESC;

-- All non-rent payments (deposits, maintenance, fees, etc.)
SELECT 
    pu.address,
    p.payment_type,
    p.amount,
    p.payment_date,
    p.description
FROM payments p
JOIN property_units pu ON p.property_unit_id = pu.id
WHERE p.payment_type != 'RENT'
ORDER BY p.payment_date DESC;

-- =============================================================================
-- DATA QUALITY CHECKS
-- =============================================================================

-- Check for properties without payments
SELECT 
    pu.id,
    pu.address,
    pu.type,
    pu.base_rent_amount,
    pu.lease_start_date
FROM property_units pu
LEFT JOIN payments p ON pu.id = p.property_unit_id
WHERE p.id IS NULL;

-- Check for payments without valid property units (should be empty due to foreign key)
SELECT p.* 
FROM payments p
LEFT JOIN property_units pu ON p.property_unit_id = pu.id
WHERE pu.id IS NULL;

-- Summary statistics
SELECT 
    'Property Units' as table_name,
    COUNT(*) as record_count,
    MIN(lease_start_date) as earliest_lease,
    MAX(lease_start_date) as latest_lease
FROM property_units
UNION ALL
SELECT 
    'Payments' as table_name,
    COUNT(*) as record_count,
    MIN(payment_date) as earliest_payment,
    MAX(payment_date) as latest_payment
FROM payments;
