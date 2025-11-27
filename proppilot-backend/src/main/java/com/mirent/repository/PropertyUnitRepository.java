package com.mirent.repository;

import com.mirent.entity.PropertyUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long> {
    List<PropertyUnit> findByTenantId(Long tenantId);
    List<PropertyUnit> findByAddressContainingIgnoreCase(String address);

    // Owner-filtered queries
    List<PropertyUnit> findByOwnerId(Long ownerId);
    Optional<PropertyUnit> findByIdAndOwnerId(Long id, Long ownerId);
    List<PropertyUnit> findByTenantIdAndOwnerId(Long tenantId, Long ownerId);
    List<PropertyUnit> findByAddressContainingIgnoreCaseAndOwnerId(String address, Long ownerId);
}
