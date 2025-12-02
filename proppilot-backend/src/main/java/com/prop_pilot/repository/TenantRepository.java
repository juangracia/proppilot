package com.prop_pilot.repository;

import com.prop_pilot.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Tenant findByNationalId(String nationalId);
    Tenant findByEmail(String email);

    // Owner-filtered queries using direct owner field
    List<Tenant> findByOwnerId(Long ownerId);

    Optional<Tenant> findByIdAndOwnerId(Long tenantId, Long ownerId);

    Optional<Tenant> findByNationalIdAndOwnerId(String nationalId, Long ownerId);

    Optional<Tenant> findByEmailAndOwnerId(String email, Long ownerId);
}
