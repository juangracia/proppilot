package com.prop_pilot.repository;

import com.prop_pilot.entity.PropertyUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyUnitRepository extends JpaRepository<PropertyUnit, Long> {
    List<PropertyUnit> findByTenantId(Long tenantId);
    List<PropertyUnit> findByAddressContainingIgnoreCase(String address);
}
