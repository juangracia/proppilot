package com.prop_pilot.repository;

import com.prop_pilot.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Tenant findByNationalId(String nationalId);
    Tenant findByEmail(String email);

    // Owner-filtered queries - find tenants through their property relationships
    @Query("SELECT DISTINCT t FROM Tenant t JOIN t.propertyUnits p WHERE p.owner.id = :ownerId")
    List<Tenant> findByPropertyOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT t FROM Tenant t JOIN t.propertyUnits p WHERE t.id = :tenantId AND p.owner.id = :ownerId")
    Optional<Tenant> findByIdAndPropertyOwnerId(@Param("tenantId") Long tenantId, @Param("ownerId") Long ownerId);

    @Query("SELECT t FROM Tenant t JOIN t.propertyUnits p WHERE t.nationalId = :nationalId AND p.owner.id = :ownerId")
    Optional<Tenant> findByNationalIdAndPropertyOwnerId(@Param("nationalId") String nationalId, @Param("ownerId") Long ownerId);

    @Query("SELECT t FROM Tenant t JOIN t.propertyUnits p WHERE t.email = :email AND p.owner.id = :ownerId")
    Optional<Tenant> findByEmailAndPropertyOwnerId(@Param("email") String email, @Param("ownerId") Long ownerId);
}
