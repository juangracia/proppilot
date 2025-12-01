package com.prop_pilot.repository;

import com.prop_pilot.entity.Lease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaseRepository extends JpaRepository<Lease, Long> {

    // Non-deleted leases queries - with JOIN FETCH for tenants
    // Use COALESCE to treat NULL as false (not deleted)
    @Query("SELECT DISTINCT l FROM Lease l LEFT JOIN FETCH l.tenants LEFT JOIN FETCH l.propertyUnit WHERE l.owner.id = :ownerId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByOwnerIdAndDeletedFalse(@Param("ownerId") Long ownerId);

    @Query("SELECT DISTINCT l FROM Lease l LEFT JOIN FETCH l.tenants LEFT JOIN FETCH l.propertyUnit WHERE l.id = :id AND l.owner.id = :ownerId AND COALESCE(l.deleted, false) = false")
    Optional<Lease> findByIdAndOwnerIdAndDeletedFalse(@Param("id") Long id, @Param("ownerId") Long ownerId);

    @Query("SELECT l FROM Lease l WHERE l.propertyUnit.id = :propertyUnitId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByPropertyUnitIdAndDeletedFalse(@Param("propertyUnitId") Long propertyUnitId);

    @Query("SELECT l FROM Lease l WHERE l.propertyUnit.id = :propertyUnitId AND l.owner.id = :ownerId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByPropertyUnitIdAndOwnerIdAndDeletedFalse(@Param("propertyUnitId") Long propertyUnitId, @Param("ownerId") Long ownerId);

    @Query("SELECT l FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByTenantIdAndDeletedFalse(@Param("tenantId") Long tenantId);

    @Query("SELECT l FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId AND l.owner.id = :ownerId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByTenantIdAndOwnerIdAndDeletedFalse(@Param("tenantId") Long tenantId, @Param("ownerId") Long ownerId);

    @Query("SELECT l FROM Lease l WHERE l.status = :status AND COALESCE(l.deleted, false) = false")
    List<Lease> findByStatusAndDeletedFalse(@Param("status") Lease.LeaseStatus status);

    @Query("SELECT l FROM Lease l WHERE l.status = :status AND l.owner.id = :ownerId AND COALESCE(l.deleted, false) = false")
    List<Lease> findByStatusAndOwnerIdAndDeletedFalse(@Param("status") Lease.LeaseStatus status, @Param("ownerId") Long ownerId);

    // Deleted leases queries - with JOIN FETCH for tenants
    @Query("SELECT DISTINCT l FROM Lease l LEFT JOIN FETCH l.tenants LEFT JOIN FETCH l.propertyUnit WHERE l.owner.id = :ownerId AND l.deleted = true")
    List<Lease> findByOwnerIdAndDeletedTrue(@Param("ownerId") Long ownerId);

    @Query("SELECT DISTINCT l FROM Lease l LEFT JOIN FETCH l.tenants LEFT JOIN FETCH l.propertyUnit WHERE l.id = :id AND l.owner.id = :ownerId AND l.deleted = true")
    Optional<Lease> findByIdAndOwnerIdAndDeletedTrue(@Param("id") Long id, @Param("ownerId") Long ownerId);

    // Include all for backward compatibility (used internally)
    List<Lease> findByOwnerId(Long ownerId);

    Optional<Lease> findByIdAndOwnerId(Long id, Long ownerId);

    List<Lease> findByPropertyUnitId(Long propertyUnitId);

    List<Lease> findByPropertyUnitIdAndOwnerId(Long propertyUnitId, Long ownerId);

    @Query("SELECT l FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId")
    List<Lease> findByTenantId(@Param("tenantId") Long tenantId);

    @Query("SELECT l FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId AND l.owner.id = :ownerId")
    List<Lease> findByTenantIdAndOwnerId(@Param("tenantId") Long tenantId, @Param("ownerId") Long ownerId);

    List<Lease> findByStatus(Lease.LeaseStatus status);

    List<Lease> findByStatusAndOwnerId(Lease.LeaseStatus status, Long ownerId);

    // Count leases (for association checks)
    @Query("SELECT COUNT(l) FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId AND COALESCE(l.deleted, false) = false")
    long countByTenantIdAndDeletedFalse(@Param("tenantId") Long tenantId);

    @Query("SELECT COUNT(l) FROM Lease l WHERE l.propertyUnit.id = :propertyUnitId AND COALESCE(l.deleted, false) = false")
    long countByPropertyUnitIdAndDeletedFalse(@Param("propertyUnitId") Long propertyUnitId);

    @Query("SELECT l FROM Lease l WHERE l.owner.id = :ownerId AND l.status = 'ACTIVE' " +
           "AND COALESCE(l.deleted, false) = false AND l.startDate <= :date AND l.endDate >= :date")
    List<Lease> findActiveLeasesByOwnerIdAndDate(
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT l FROM Lease l WHERE l.propertyUnit.id = :propertyUnitId " +
           "AND l.owner.id = :ownerId AND l.status = 'ACTIVE' AND COALESCE(l.deleted, false) = false " +
           "AND l.startDate <= :date AND l.endDate >= :date")
    Optional<Lease> findActiveLeaseByPropertyUnitIdAndOwnerId(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT l FROM Lease l JOIN l.tenants t WHERE t.id = :tenantId " +
           "AND l.owner.id = :ownerId AND l.status = 'ACTIVE' AND COALESCE(l.deleted, false) = false " +
           "AND l.startDate <= :date AND l.endDate >= :date")
    List<Lease> findActiveLeasesByTenantIdAndOwnerId(
        @Param("tenantId") Long tenantId,
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM Lease l " +
           "WHERE l.propertyUnit.id = :propertyUnitId AND l.status = 'ACTIVE' AND COALESCE(l.deleted, false) = false " +
           "AND ((l.startDate <= :endDate AND l.endDate >= :startDate))")
    boolean existsOverlappingLease(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM Lease l " +
           "WHERE l.propertyUnit.id = :propertyUnitId AND l.status = 'ACTIVE' AND COALESCE(l.deleted, false) = false " +
           "AND l.id != :excludeLeaseId " +
           "AND ((l.startDate <= :endDate AND l.endDate >= :startDate))")
    boolean existsOverlappingLeaseExcluding(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeLeaseId") Long excludeLeaseId
    );
}
