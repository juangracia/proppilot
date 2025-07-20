# DBeaver Setup Guide for PropPilot Database

This guide will help you import the PropPilot database project into DBeaver for easy database management and querying.

## Prerequisites

1. **DBeaver Community Edition** (free) or **DBeaver Enterprise**
   - Download from: https://dbeaver.io/download/
2. **PropPilot PostgreSQL Database** running (see SETUP.md)
3. **PostgreSQL JDBC Driver** (automatically downloaded by DBeaver)

## Method 1: Import Complete Project (Recommended)

### Step 1: Import Project
1. Open DBeaver
2. Go to **File** → **Import**
3. Select **General** → **Existing Projects into Workspace**
4. Click **Next**
5. Select **Select root directory** and browse to:
   ```
   /Users/juangracia/proppilot/CascadeProjects/windsurf-project
   ```
6. You should see "PropPilot Database" project listed
7. Check the project and click **Finish**

### Step 2: Verify Connection
1. In the **Database Navigator**, expand the "PropPilot PostgreSQL" connection
2. If prompted for password, enter: `proppilot123`
3. You should see the `proppilot` database with tables:
   - `property_units`
   - `payments`
   - `tenants`

## Method 2: Manual Connection Setup

If the import doesn't work, create the connection manually:

### Step 1: Create New Connection
1. Click **New Database Connection** (plug icon)
2. Select **PostgreSQL**
3. Click **Next**

### Step 2: Configure Connection
**Main Tab:**
- **Server Host:** `localhost`
- **Port:** `5432`
- **Database:** `proppilot`
- **Username:** `proppilot`
- **Password:** `proppilot123`

**PostgreSQL Tab:**
- **Show non-default databases:** ✓ (checked)
- **Show template databases:** ✗ (unchecked)
- **Show unavailable databases:** ✗ (unchecked)

### Step 3: Test and Save
1. Click **Test Connection**
2. If successful, click **Finish**
3. Name the connection "PropPilot PostgreSQL"

## Exploring the Database

### Database Schema
The PropPilot database contains these main tables:

#### `property_units`
- **id** (Primary Key)
- **address** - Property address
- **type** - Property type (Apartment, House, Townhouse)
- **base_rent_amount** - Monthly rent amount
- **lease_start_date** - When the lease started
- **tenant_id** - Foreign key to tenants table

#### `payments`
- **id** (Primary Key)
- **property_unit_id** - Foreign key to property_units
- **amount** - Payment amount
- **payment_date** - Date of payment
- **payment_type** - Type (RENT, DEPOSIT, MAINTENANCE, OTHER)
- **description** - Payment description
- **status** - Payment status

#### `tenants`
- **id** (Primary Key)
- **name** - Tenant name
- **email** - Tenant email
- **phone** - Tenant phone
- **national_id** - Tenant identification

### Sample Data
The database is pre-populated with:
- **10 Property Units** with realistic addresses and rent amounts ($1,600 - $3,200)
- **22+ Payments** including rent, deposits, maintenance fees
- **Various Payment Types** across different properties and dates

### Ready-to-Use SQL Scripts
The project includes `Scripts/PropPilot-Sample-Queries.sql` with:

1. **Basic Data Exploration**
   - View all properties and payments
   - Count summaries

2. **Property Analysis**
   - Properties by type
   - Properties with payment totals
   - Performance reports

3. **Payment Analysis**
   - Payments by type
   - Monthly summaries
   - Recent payments

4. **Financial Reports**
   - Property performance
   - Outstanding rent analysis
   - Maintenance expenses

5. **Data Quality Checks**
   - Properties without payments
   - Summary statistics

## Using the Sample Queries

1. **Open SQL Script:**
   - In DBeaver, navigate to **Scripts** → **PropPilot-Sample-Queries.sql**
   - Double-click to open

2. **Execute Queries:**
   - Select any query (or part of it)
   - Press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)
   - Results will appear in the bottom panel

3. **Explore Data:**
   - Try the "Basic Data Exploration" queries first
   - Use "Financial Reports" for business insights
   - Modify queries to suit your needs

## Useful DBeaver Features for PropPilot

### 1. Data Editor
- Right-click any table → **Edit Data**
- Add, modify, or delete records directly
- Changes are committed automatically

### 2. ER Diagram
- Right-click database → **View Diagram**
- Visual representation of table relationships
- Shows foreign key connections

### 3. Data Export
- Right-click table → **Export Data**
- Export to CSV, Excel, JSON, etc.
- Useful for reports and backups

### 4. Query History
- **Window** → **Show View** → **Query Manager**
- Access all previously executed queries
- Save frequently used queries

### 5. SQL Formatter
- Select SQL text → **Ctrl+Shift+F**
- Automatically formats SQL for readability

## Troubleshooting

### Connection Issues
1. **Ensure PostgreSQL is running:**
   ```bash
   docker-compose ps
   ```
   Should show `proppilot-postgres` as "Up"

2. **Check database credentials:**
   - Username: `proppilot`
   - Password: `proppilot123`
   - Database: `proppilot`
   - Port: `5432`

3. **Test connection from command line:**
   ```bash
   psql -h localhost -p 5432 -U proppilot -d proppilot
   ```

### Import Issues
1. **Project not visible:** Make sure you're selecting the correct directory
2. **Connection fails:** Verify PostgreSQL is running and credentials are correct
3. **Tables not visible:** Check if you're connected to the `proppilot` database (not `postgres`)

### Performance Tips
1. **Limit large queries:** Add `LIMIT 100` to queries returning many rows
2. **Use indexes:** The database has proper indexes on foreign keys
3. **Close unused connections:** Right-click connection → **Disconnect**

## Advanced Usage

### Custom Queries
Create your own queries for:
- Tenant management reports
- Rent collection analysis
- Property maintenance tracking
- Financial projections

### Data Visualization
DBeaver supports basic charts:
1. Execute a query with numeric results
2. Right-click results → **View/Format** → **Charts**
3. Choose chart type (bar, line, pie, etc.)

### Backup and Restore
1. **Backup:** Right-click database → **Tools** → **Backup**
2. **Restore:** Right-click database → **Tools** → **Restore**

## Integration with PropPilot Application

The DBeaver connection gives you direct access to the same data used by:
- **PropPilot Web App** (http://localhost:5173)
- **PropPilot API** (http://localhost:8080/api)
- **Swagger Documentation** (http://localhost:8080/swagger-ui/index.html)

Any changes made in DBeaver will be immediately reflected in the web application and vice versa.

## Support

For DBeaver-specific issues:
- **Documentation:** https://dbeaver.io/docs/
- **Community:** https://github.com/dbeaver/dbeaver/discussions

For PropPilot database questions:
- Check the sample queries in `Scripts/PropPilot-Sample-Queries.sql`
- Review the API documentation at http://localhost:8080/swagger-ui/index.html
