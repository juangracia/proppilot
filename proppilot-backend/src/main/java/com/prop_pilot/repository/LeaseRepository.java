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

    List<Lease> findByOwnerId(Long ownerId);

    Optional<Lease> findByIdAndOwnerId(Long id, Long ownerId);

    List<Lease> findByPropertyUnitId(Long propertyUnitId);

    List<Lease> findByPropertyUnitIdAndOwnerId(Long propertyUnitId, Long ownerId);

    List<Lease> findByTenantId(Long tenantId);

    List<Lease> findByTenantIdAndOwnerId(Long tenantId, Long ownerId);

    List<Lease> findByStatus(Lease.LeaseStatus status);

    List<Lease> findByStatusAndOwnerId(Lease.LeaseStatus status, Long ownerId);

    @Query("SELECT l FROM Lease l WHERE l.owner.id = :ownerId AND l.status = 'ACTIVE' " +
           "AND l.startDate <= :date AND l.endDate >= :date")
    List<Lease> findActiveLeasesByOwnerIdAndDate(
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT l FROM Lease l WHERE l.propertyUnit.id = :propertyUnitId " +
           "AND l.owner.id = :ownerId AND l.status = 'ACTIVE' " +
           "AND l.startDate <= :date AND l.endDate >= :date")
    Optional<Lease> findActiveLeaseByPropertyUnitIdAndOwnerId(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT l FROM Lease l WHERE l.tenant.id = :tenantId " +
           "AND l.owner.id = :ownerId AND l.status = 'ACTIVE' " +
           "AND l.startDate <= :date AND l.endDate >= :date")
    Optional<Lease> findActiveLeaseByTenantIdAndOwnerId(
        @Param("tenantId") Long tenantId,
        @Param("ownerId") Long ownerId,
        @Param("date") LocalDate date
    );

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM Lease l " +
           "WHERE l.propertyUnit.id = :propertyUnitId AND l.status = 'ACTIVE' " +
           "AND ((l.startDate <= :endDate AND l.endDate >= :startDate))")
    boolean existsOverlappingLease(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM Lease l " +
           "WHERE l.propertyUnit.id = :propertyUnitId AND l.status = 'ACTIVE' " +
           "AND l.id != :excludeLeaseId " +
           "AND ((l.startDate <= :endDate AND l.endDate >= :startDate))")
    boolean existsOverlappingLeaseExcluding(
        @Param("propertyUnitId") Long propertyUnitId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("excludeLeaseId") Long excludeLeaseId
    );
}
