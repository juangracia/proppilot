package com.prop_pilot.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DatabaseMigrationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final DataSource dataSource;

    @Autowired
    public DatabaseMigrationRunner(DataSource dataSource) {
        this.dataSource = dataSource;
        runMigrations();
    }

    private void runMigrations() {
        log.info("Running database migrations...");
        try (Connection conn = dataSource.getConnection()) {
            addDeletedColumnIfNotExists(conn);
            addDeletedAtColumnIfNotExists(conn);
            makeTenantIdNullable(conn);
            updateAdjustmentIndexConstraint(conn);
            log.info("Database migrations completed successfully");
        } catch (Exception e) {
            log.error("Database migration failed", e);
        }
    }

    private void addDeletedColumnIfNotExists(Connection conn) throws Exception {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet rs = metaData.getColumns(null, null, "leases", "deleted")) {
            if (!rs.next()) {
                log.info("Adding 'deleted' column to leases table");
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("ALTER TABLE leases ADD COLUMN deleted boolean DEFAULT false");
                }
            } else {
                log.info("'deleted' column already exists in leases table");
            }
        }
    }

    private void addDeletedAtColumnIfNotExists(Connection conn) throws Exception {
        DatabaseMetaData metaData = conn.getMetaData();
        try (ResultSet rs = metaData.getColumns(null, null, "leases", "deleted_at")) {
            if (!rs.next()) {
                log.info("Adding 'deleted_at' column to leases table");
                try (Statement stmt = conn.createStatement()) {
                    stmt.execute("ALTER TABLE leases ADD COLUMN deleted_at timestamp");
                }
            } else {
                log.info("'deleted_at' column already exists in leases table");
            }
        }
    }

    private void makeTenantIdNullable(Connection conn) throws Exception {
        log.info("Making tenant_id column nullable (multi-tenant support migration)");
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE leases ALTER COLUMN tenant_id DROP NOT NULL");
            log.info("tenant_id column is now nullable");
        } catch (Exception e) {
            log.info("tenant_id column already nullable or doesn't exist: " + e.getMessage());
        }
    }

    private void updateAdjustmentIndexConstraint(Connection conn) {
        log.info("Updating adjustment_index check constraint to include dollar indices...");
        try (Statement stmt = conn.createStatement()) {
            // Drop old constraint
            stmt.execute("ALTER TABLE leases DROP CONSTRAINT IF EXISTS leases_adjustment_index_check");

            // Add new constraint with all adjustment index values including dollar indices
            stmt.execute(
                "ALTER TABLE leases ADD CONSTRAINT leases_adjustment_index_check " +
                "CHECK (adjustment_index IN ('ICL', 'IPC', 'NONE', 'DOLAR_BLUE', 'DOLAR_MEP', 'DOLAR_OFICIAL'))"
            );
            log.info("Successfully updated adjustment_index check constraint");
        } catch (Exception e) {
            log.warn("Could not update adjustment_index constraint (may already be correct): " + e.getMessage());
        }
    }
}
